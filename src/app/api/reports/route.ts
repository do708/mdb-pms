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

        for(const workorder of workorders){

            if(
                !workorder.plannedDate
                || !workorder.assignedUser
            ){
                continue;
            }

            const engineer =
                workorder.assignedUser;

            const key =
                engineerDayKey(
                    engineer.id,
                    workorder.plannedDate
                );

            const oplever =
                mergeOpleverData(workorder.formData);

            if(oplever.tarief.voorrijtarief === true){
                continue;
            }

            const item: DayItem = {
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

            const existing =
                dayGroups.get(key);

            if(existing){
                existing.items.push(item);
            } else {
                dayGroups.set(key,{
                    engineerId:engineer.id,
                    engineerName:
                        engineer.name ?? "Onbekend",
                    plannedDate:
                        workorder.plannedDate,
                    items:[item]
                });
            }

        }

        for(const row of projectUren){

            const engineer = row.user;

            const key =
                engineerDayKey(
                    engineer.id,
                    row.datum
                );

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

            const existing =
                dayGroups.get(key);

            if(existing){
                existing.items.push(item);
            } else {
                dayGroups.set(key,{
                    engineerId:engineer.id,
                    engineerName:
                        engineer.name ?? "Onbekend",
                    plannedDate:row.datum,
                    items:[item]
                });
            }

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


        let hoursThisMonth = 0;

        let hoursTotal = 0;

        let kilometersThisMonth = 0;

        const dayTravelApplied =
            new Set<string>();




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

                if(workorder.plannedDate){

                    const dayKey =
                        engineerDayKey(
                            engineer.id,
                            workorder.plannedDate
                        );

                    if(!dayTravelApplied.has(dayKey)){

                        dayTravelApplied.add(dayKey);

                        const group =
                            dayGroups.get(dayKey);

                        const travel = group
                            ?
                            await travelForDayGroup(
                                dayKey,
                                group
                            )
                            :
                            { kilometers:0, reisuren:0 };

                        existing.kilometers +=
                            travel.kilometers;
                        existing.travel +=
                            travel.reisuren;

                        if(
                            isInCurrentMonth(
                                workorder.plannedDate,
                                monthStart,
                                monthEnd
                            )
                        ){
                            kilometersThisMonth +=
                                travel.kilometers;
                            existing.kilometersThisMonth +=
                                travel.kilometers;
                        }

                    }

                }

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

            const dayKey =
                engineerDayKey(
                    engineer.id,
                    row.datum
                );

            if(!dayTravelApplied.has(dayKey)){

                dayTravelApplied.add(dayKey);

                const group =
                    dayGroups.get(dayKey);

                const travel = group
                    ?
                    await travelForDayGroup(
                        dayKey,
                        group
                    )
                    :
                    { kilometers:0, reisuren:0 };

                existing.kilometers +=
                    travel.kilometers;
                existing.travel +=
                    travel.reisuren;

                if(
                    isInCurrentMonth(
                        row.datum,
                        monthStart,
                        monthEnd
                    )
                ){
                    kilometersThisMonth +=
                        travel.kilometers;
                    existing.kilometersThisMonth +=
                        travel.kilometers;
                }

            }

            byEngineer.set(engineer.id, existing);

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
                .sort((a,b)=>b.hours - a.hours)

        });


    } catch(error){


        console.error("REPORTS ERROR", error);

        return NextResponse.json(
            { error:"Rapportage ophalen mislukt" },
            { status:500 }
        );


    }


}
