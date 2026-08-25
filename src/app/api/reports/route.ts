import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";

import {
    mergeOpleverData,
    parseClockHours,
} from "@/types/oplever";

import { decimalToNumber } from "@/lib/projects/budget";

import {
    engineerDayKey,
    jobAddressFromWorkorder,
    plannedTravelForEngineerDay,
    projectJobAddress,
} from "@/lib/travel/plannedKilometers";

import { amsterdamDateKey, toDateKey } from "@/lib/reports/periods";



export const maxDuration = 60;



function num(value:unknown):number {

    if(typeof value === "number"){
        return isNaN(value) ? 0 : value;
    }

    if(typeof value === "string"){
        const cleaned =
            value.replace(",", ".").trim();
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
    }

    return 0;

}



function isInCurrentMonth(
    date:Date,
    monthStart:Date,
    monthEnd:Date
):boolean {
    return date >= monthStart && date < monthEnd;
}



export async function GET(){


    try {


        const guard =
            await requireApiRole([
                "admin",
                "office"
            ]);


        if(!guard.ok){
            return guard.response;
        }




        const now =
            new Date();


        const monthStart =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );

        const monthEnd =
            new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                1
            );




        const workorders =
            await prisma.workorder.findMany({

                select:{

                    id:true,

                    status:true,

                    createdAt:true,

                    plannedDate:true,

                    location:true,

                    straat:true,

                    huisnummer:true,

                    postcode:true,

                    city:true,

                    formData:true,

                    plannedRoundTripKm:true,

                    plannedReisuren:true,

                    assignedUser:{
                        select:{
                            id:true,
                            name:true
                        }
                    },

                    extraEngineers:{
                        select:{
                            user:{
                                select:{
                                    id:true,
                                    name:true
                                }
                            }
                        }
                    },

                    customer:{
                        select:{
                            id:true,
                            name:true,
                            address:true
                        }
                    },

                    project:{
                        select:{
                            customer:{
                                select:{
                                    id:true,
                                    name:true
                                }
                            }
                        }
                    }

                }

            });




        const projectUren =
            await prisma.projectUur.findMany({

                select:{

                    datum:true,

                    uren:true,

                    kilometers:true,

                    user:{
                        select:{
                            id:true,
                            name:true
                        }
                    },

                    project:{
                        select:{
                            location:true,
                            plaats:true,
                            customer:{
                                select:{
                                    id:true,
                                    name:true,
                                    address:true
                                }
                            }
                        }
                    }

                }

            });




        const leaveForms =
            await prisma.formSubmission.findMany({
                where: {
                    type: "verlof",
                    status: "geaccepteerd",
                },
                select: {
                    data: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

        type DayItem = {
            formKilometers:number;
            formReisuren:number;
            storedKilometers:number | null;
            storedReisuren:number | null;
            jobAddress:string | null;
            plannedDate:Date;
        };

        type DayGroup = {
            engineerId:string;
            engineerName:string;
            plannedDate:Date;
            items:DayItem[];
        };

        const dayGroups =
            new Map<string,DayGroup>();

        function addDayItem(
            engineer:{ id:string; name:string | null },
            plannedDate:Date,
            item:DayItem
        ){
            const key =
                engineerDayKey(
                    engineer.id,
                    plannedDate
                );

            const existing =
                dayGroups.get(key);

            if(existing){
                existing.items.push(item);
            } else {
                dayGroups.set(key,{
                    engineerId:engineer.id,
                    engineerName:
                        engineer.name ?? "Onbekend",
                    plannedDate,
                    items:[item]
                });
            }
        }

        for(const workorder of workorders){

            if(!workorder.plannedDate){
                continue;
            }

            const oplever =
                mergeOpleverData(workorder.formData);

            if(oplever.tarief.voorrijtarief === true){
                continue;
            }

            const baseItem: DayItem = {
                formKilometers:
                    num(oplever.tarief.kilometers),
                formReisuren:
                    parseClockHours(
                        oplever.tarief.reisuren
                    ),
                storedKilometers:
                    workorder.plannedRoundTripKm,
                storedReisuren:
                    workorder.plannedReisuren,
                jobAddress:
                    jobAddressFromWorkorder(
                        workorder
                    ),
                plannedDate:
                    workorder.plannedDate
            };

            if(workorder.assignedUser){
                addDayItem(
                    workorder.assignedUser,
                    workorder.plannedDate,
                    baseItem
                );
            }

            // Extra monteurs: zelfde stop, maar zonder primary-opgeslagen deel
            // (hun dagroute wordt live/via sync herberekend).
            for(const extra of workorder.extraEngineers){
                if(!extra.user){
                    continue;
                }
                if(
                    workorder.assignedUser
                    && extra.user.id
                        === workorder.assignedUser.id
                ){
                    continue;
                }
                addDayItem(
                    extra.user,
                    workorder.plannedDate,
                    {
                        ...baseItem,
                        storedKilometers:null,
                        storedReisuren:null
                    }
                );
            }

        }

        for(const row of projectUren){

            const engineer = row.user;

            const item: DayItem = {
                formKilometers:0,
                formReisuren:0,
                storedKilometers:row.kilometers,
                storedReisuren:null,
                jobAddress:
                    projectJobAddress(
                        row.project
                    ),
                plannedDate:row.datum
            };

            addDayItem(
                engineer,
                row.datum,
                item
            );

        }

        const dayTravelCache =
            new Map<string,{
                kilometers:number;
                reisuren:number;
            }>();

        async function travelForDayGroup(
            key:string,
            group:DayGroup
        ): Promise<{
            kilometers:number;
            reisuren:number;
        }> {

            if(dayTravelCache.has(key)){
                return dayTravelCache.get(key)!;
            }

            // Voorkeur: opgeslagen km/reistijd (vastgelegd bij plan/boek)
            let useStored = true;
            let storedKm = 0;
            let storedReis = 0;

            for(const item of group.items){
                if(item.formKilometers > 0){
                    storedKm += item.formKilometers;
                    storedReis += item.formReisuren;
                    continue;
                }

                if(item.storedKilometers != null){
                    storedKm += item.storedKilometers;
                    storedReis +=
                        item.storedReisuren ?? 0;
                    continue;
                }

                if(item.jobAddress){
                    useStored = false;
                    break;
                }
            }

            const travel = useStored
                ?
                {
                    kilometers:Math.round(storedKm),
                    reisuren:storedReis
                }
                :
                await plannedTravelForEngineerDay(
                    group.items
                );

            dayTravelCache.set(key, travel);

            return travel;

        }




        const byStatus:Record<string,number> = {};

        for(const workorder of workorders){
            byStatus[workorder.status] =
                (byStatus[workorder.status] ?? 0) + 1;
        }




        const byEngineer =
            new Map<string,{
                name:string;
                hours:number;
                travel:number;
                kilometers:number;
                kilometersThisMonth:number;
            }>();


        const byCustomer =
            new Map<string,{
                name:string;
                hours:number;
            }>();


        type DayAgg = {
            date:string;
            engineerId:string;
            engineerName:string;
            hours:number;
            travel:number;
            kilometers:number;
            customers:Map<string,{
                id:string;
                name:string;
                hours:number;
            }>;
        };

        const byDay =
            new Map<string,DayAgg>();

        function upsertDay(
            date:string,
            engineerId:string,
            engineerName:string
        ):DayAgg {
            const key = `${date}|${engineerId}`;
            const existing = byDay.get(key);
            if(existing){
                return existing;
            }
            const created:DayAgg = {
                date,
                engineerId,
                engineerName,
                hours:0,
                travel:0,
                kilometers:0,
                customers:new Map()
            };
            byDay.set(key, created);
            return created;
        }

        function addDayCustomerHours(
            row:DayAgg,
            customer:{ id:string; name:string },
            hours:number
        ){
            if(hours <= 0){
                return;
            }
            const existing =
                row.customers.get(customer.id)
                ??
                {
                    id:customer.id,
                    name:customer.name,
                    hours:0
                };
            existing.hours += hours;
            row.customers.set(customer.id, existing);
        }


        let hoursThisMonth = 0;

        let hoursTotal = 0;

        let kilometersThisMonth = 0;




        for(const workorder of workorders){


            const oplever =
                mergeOpleverData(workorder.formData);


            const uren =
                parseClockHours(oplever.tarief.urenMonteur1) +
                parseClockHours(oplever.tarief.urenMonteur2) +
                parseClockHours(oplever.tarief.urenMonteur3) +
                parseClockHours(oplever.tarief.urenMonteur4);


            hoursTotal += uren;


            if(workorder.createdAt >= monthStart){
                hoursThisMonth += uren;
            }




            const engineer =
                workorder.assignedUser;


            if(engineer){

                const existing =
                    byEngineer.get(engineer.id)
                    ??
                    {
                        name:
                            engineer.name ?? "Onbekend",
                        hours:0,
                        travel:0,
                        kilometers:0,
                        kilometersThisMonth:0
                    };

                existing.hours += uren;

                byEngineer.set(engineer.id, existing);

            }




            const customer =
                workorder.customer
                ??
                workorder.project?.customer
                ??
                { id:"onbekend", name:"Onbekende opdrachtgever" };


            const existingCustomer =
                byCustomer.get(customer.id)
                ??
                {
                    name:customer.name,
                    hours:0
                };

            existingCustomer.hours += uren;

            byCustomer.set(customer.id, existingCustomer);


            if(uren > 0){
                const day =
                    upsertDay(
                        amsterdamDateKey(
                            workorder.plannedDate ?? workorder.createdAt
                        ),
                        engineer?.id || "geen",
                        engineer
                            ? (engineer.name ?? "Onbekend")
                            : "Geen monteur"
                    );

                day.hours += uren;
                addDayCustomerHours(day, customer, uren);
            }


        }



        for(const row of projectUren){

            const engineer = row.user;
            const uren = decimalToNumber(row.uren);

            hoursTotal += uren;

            if(row.datum >= monthStart){
                hoursThisMonth += uren;
            }

            const existing =
                byEngineer.get(engineer.id)
                ??
                {
                    name:
                        engineer.name ?? "Onbekend",
                    hours:0,
                    travel:0,
                    kilometers:0,
                    kilometersThisMonth:0
                };

            existing.hours += uren;

            const customer =
                row.project.customer
                ??
                { id:"onbekend", name:"Onbekende opdrachtgever" };

            const existingCustomer =
                byCustomer.get(customer.id)
                ??
                {
                    name:customer.name,
                    hours:0
                };

            existingCustomer.hours += uren;
            byCustomer.set(customer.id, existingCustomer);

            byEngineer.set(engineer.id, existing);

            if(uren > 0){
                const day =
                    upsertDay(
                        amsterdamDateKey(row.datum),
                        engineer.id,
                        engineer.name ?? "Onbekend"
                    );

                day.hours += uren;
                addDayCustomerHours(day, customer, uren);
            }

        }


        // Kilometers/reistijd: één dagroute per monteur (zaak → stops → zaak)
        for(const [dayKey, group] of dayGroups){

            const travel =
                await travelForDayGroup(dayKey, group);

            const existing =
                byEngineer.get(group.engineerId)
                ??
                {
                    name:group.engineerName,
                    hours:0,
                    travel:0,
                    kilometers:0,
                    kilometersThisMonth:0
                };

            existing.kilometers += travel.kilometers;
            existing.travel += travel.reisuren;

            if(
                isInCurrentMonth(
                    group.plannedDate,
                    monthStart,
                    monthEnd
                )
            ){
                kilometersThisMonth +=
                    travel.kilometers;
                existing.kilometersThisMonth +=
                    travel.kilometers;
            }

            byEngineer.set(group.engineerId, existing);

            const day =
                upsertDay(
                    amsterdamDateKey(group.plannedDate),
                    group.engineerId,
                    group.engineerName
                );

            day.travel += travel.reisuren;
            day.kilometers += travel.kilometers;

        }




        return NextResponse.json({

            totals:{
                workorders:
                    workorders.length,
                hoursTotal,
                hoursThisMonth,
                kilometersThisMonth:
                    Math.round(kilometersThisMonth)
            },

            byStatus,

            byEngineer:
                Array.from(byEngineer.values())
                .sort((a,b)=>b.hours - a.hours),

            byCustomer:
                Array.from(byCustomer.values())
                .sort((a,b)=>b.hours - a.hours),

            byDay:
                Array.from(byDay.values())
                .map((row)=>({
                    date:row.date,
                    engineerId:row.engineerId,
                    engineerName:row.engineerName,
                    hours:row.hours,
                    travel:row.travel,
                    kilometers:Math.round(row.kilometers),
                    customers:
                        Array.from(row.customers.values())
                        .sort((a,b)=>b.hours - a.hours)
                }))
                .sort((a,b)=>
                    a.date === b.date
                    ?
                    a.engineerName.localeCompare(b.engineerName, "nl")
                    :
                    a.date < b.date ? 1 : -1
                ),

            leave:
                leaveForms
                .map((form)=>{
                    const data =
                        (form.data ?? {}) as Record<string, unknown>;
                    const from =
                        toDateKey(data.eersteDag);
                    const to =
                        toDateKey(data.laatsteDag) ?? from;

                    if(!from || !to){
                        return null;
                    }

                    return {
                        userId: form.user.id,
                        userName:
                            form.user.name ?? "Onbekend",
                        from,
                        to
                    };
                })
                .filter((row): row is {
                    userId: string;
                    userName: string;
                    from: string;
                    to: string;
                } => row !== null)

        });


    } catch(error){


        console.error("REPORTS ERROR", error);

        return NextResponse.json(
            { error:"Rapportage ophalen mislukt" },
            { status:500 }
        );


    }


}
