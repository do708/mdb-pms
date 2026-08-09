import { prisma } from "@/lib/prisma";

import { mergeOpleverData } from "@/types/oplever";

import {
    officeRouteFromJobs,
    endOfCalendarDay,
    jobAddressFromWorkorder,
    projectJobAddress,
    startOfCalendarDay,
} from "@/lib/travel/plannedKilometers";



function num(value: unknown): number {
    if(typeof value === "number"){
        return isNaN(value) ? 0 : value;
    }
    if(typeof value === "string"){
        const n = parseFloat(
            value.replace(",", ".").trim()
        );
        return isNaN(n) ? 0 : n;
    }
    return 0;
}



type Stop = {
    id: string;
    sortAt: number;
    address: string;
    /** Alleen primary assignee mag plannedRoundTripKm op de opdracht schrijven. */
    ownsStoredFields: boolean;
};



async function routeShareForStops(
    stops: Stop[]
): Promise<{
    kmPerStop: number | null;
    reisurenPerStop: number | null;
}> {

    if(stops.length === 0){
        return {
            kmPerStop:null,
            reisurenPerStop:null
        };
    }

    const ordered = [...stops].sort(
        (a,b)=>a.sortAt - b.sortAt
    );

    const route =
        await officeRouteFromJobs(
            ordered.map((s)=>s.address)
        );

    if(!route){
        return {
            kmPerStop:null,
            reisurenPerStop:null
        };
    }

    const n = ordered.length;

    return {
        kmPerStop:
            Math.round(route.kilometers / n),
        reisurenPerStop:
            Math.round(
                (route.reisuren / n) * 4
            ) / 4
    };

}



/**
 * Herberekent km bij plannen:
 * - dagroute monteur: Monitorweg 10 → klus(sen) → Monitorweg 10
 * - werkbonnen onderling (incl. extra monteur op dezelfde opdracht)
 * - project-uren onderling (alleen projectlocaties, géén werkbon-km)
 */
export async function syncEngineerDayKilometers(
    engineerId: string | null | undefined,
    plannedDate: Date | null | undefined
): Promise<void> {

    if(!engineerId || !plannedDate){
        return;
    }

    const dayStart = startOfCalendarDay(plannedDate);
    const dayEnd = endOfCalendarDay(plannedDate);

    const [workorders, projectUren] =
        await Promise.all([
            prisma.workorder.findMany({
                where:{
                    plannedDate:{
                        gte:dayStart,
                        lt:dayEnd
                    },
                    OR:[
                        { assignedUserId:engineerId },
                        {
                            extraEngineers:{
                                some:{
                                    userId:engineerId
                                }
                            }
                        }
                    ]
                },
                orderBy:{
                    plannedDate:"asc"
                },
                select:{
                    id:true,
                    plannedDate:true,
                    assignedUserId:true,
                    location:true,
                    straat:true,
                    huisnummer:true,
                    postcode:true,
                    city:true,
                    formData:true,
                    customer:{
                        select:{
                            address:true
                        }
                    }
                }
            }),
            prisma.projectUur.findMany({
                where:{
                    userId:engineerId,
                    datum:{
                        gte:dayStart,
                        lt:dayEnd
                    }
                },
                orderBy:[
                    { datum:"asc" },
                    { createdAt:"asc" }
                ],
                select:{
                    id:true,
                    datum:true,
                    createdAt:true,
                    project:{
                        select:{
                            location:true,
                            plaats:true,
                            customer:{
                                select:{
                                    address:true
                                }
                            }
                        }
                    }
                }
            })
        ]);

    // --- Opdrachten: kantoor → alle klussen die dag → kantoor ---
    const workorderStops: Stop[] = [];

    for(const wo of workorders){
        const oplever =
            mergeOpleverData(wo.formData);

        if(oplever.tarief.voorrijtarief === true){
            continue;
        }

        if(num(oplever.tarief.kilometers) > 0){
            continue;
        }

        const job =
            jobAddressFromWorkorder(wo);

        if(job && wo.plannedDate){
            workorderStops.push({
                id:wo.id,
                sortAt:wo.plannedDate.getTime(),
                address:job,
                ownsStoredFields:
                    wo.assignedUserId === engineerId
            });
        }
    }

    const workorderShare =
        await routeShareForStops(workorderStops);

    const autoWorkorderIds =
        new Set(workorderStops.map((s)=>s.id));

    for(const wo of workorders){

        // Extra monteur: velden op de opdracht horen bij de primary.
        if(wo.assignedUserId !== engineerId){
            continue;
        }

        const oplever =
            mergeOpleverData(wo.formData);

        const formKm = num(
            oplever.tarief.kilometers
        );

        const usesVoorrij =
            oplever.tarief.voorrijtarief === true;

        const inAuto =
            autoWorkorderIds.has(wo.id);

        const plannedRoundTripKm =
            usesVoorrij || formKm > 0 || !inAuto
            ?
            null
            :
            workorderShare.kmPerStop;

        const plannedReisuren =
            usesVoorrij || formKm > 0 || !inAuto
            ?
            null
            :
            workorderShare.reisurenPerStop;

        await prisma.workorder.update({
            where:{
                id:wo.id
            },
            data:{
                plannedRoundTripKm,
                plannedReisuren
            }
        });
    }

    // --- Project-uren: alleen projectlocaties (geen opdracht-km) ---
    type ProjectGroup = {
        address: string;
        rowIds: string[];
        sortAt: number;
    };

    const byProjectAddress =
        new Map<string,ProjectGroup>();

    for(const pu of projectUren){
        const job =
            projectJobAddress(pu.project);

        if(!job){
            await prisma.projectUur.update({
                where:{
                    id:pu.id
                },
                data:{
                    kilometers:null
                }
            });
            continue;
        }

        const key = job.toLowerCase();
        const existing =
            byProjectAddress.get(key);

        if(existing){
            existing.rowIds.push(pu.id);
        } else {
            byProjectAddress.set(key,{
                address:job,
                rowIds:[pu.id],
                sortAt:
                    pu.datum.getTime()
                    + (pu.createdAt.getTime() % 86400000)
            });
        }
    }

    const projectGroups =
        Array.from(byProjectAddress.values())
        .sort((a,b)=>a.sortAt - b.sortAt);

    const projectStops: Stop[] =
        projectGroups.map((g, index)=>({
            id:String(index),
            sortAt:g.sortAt,
            address:g.address,
            ownsStoredFields:true
        }));

    const projectShare =
        await routeShareForStops(projectStops);

    for(const group of projectGroups){

        const km =
            projectShare.kmPerStop;

        const perRow =
            km != null
            && group.rowIds.length > 0
            ?
            Math.round(km / group.rowIds.length)
            :
            null;

        for(const rowId of group.rowIds){
            await prisma.projectUur.update({
                where:{
                    id:rowId
                },
                data:{
                    kilometers:perRow
                }
            });
        }
    }

}

export async function clearAllAutoKilometers(): Promise<{
    workorders: number;
    projectUren: number;
}> {
    const [workorders, projectUren] = await Promise.all([
        prisma.workorder.updateMany({
            where: {
                OR: [
                    { plannedRoundTripKm: { not: null } },
                    { plannedReisuren: { not: null } },
                ],
            },
            data: {
                plannedRoundTripKm: null,
                plannedReisuren: null,
            },
        }),
        prisma.projectUur.updateMany({
            where: {
                kilometers: { not: null },
            },
            data: {
                kilometers: null,
            },
        }),
    ]);

    return {
        workorders: workorders.count,
        projectUren: projectUren.count,
    };
}
