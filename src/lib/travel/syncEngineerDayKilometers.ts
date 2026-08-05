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
 * Herberekent km apart:
 * - werkbonnen onderling (andere werkbonnen die dag)
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
                    assignedUserId:engineerId,
                    plannedDate:{
                        gte:dayStart,
                        lt:dayEnd
                    }
                },
                orderBy:{
                    plannedDate:"asc"
                },
                select:{
                    id:true,
                    plannedDate:true,
                    location:true,
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

    // --- Werkbonnen: alleen onderlinge klussen ---
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
                address:job
            });
        }
    }

    const workorderShare =
        await routeShareForStops(workorderStops);

    const autoWorkorderIds =
        new Set(workorderStops.map((s)=>s.id));

    for(const wo of workorders){

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

    // --- Project-uren: alleen projectlocaties (geen werkbon-km) ---
    // Per project één rit: zaak → project → zaak.
    // Meerdere urenregels op hetzelfde project/zelfde dag delen die rit.
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

    // Meerdere verschillende projecten op één dag:
    // één gecombineerde projectroute, gedeeld over projecten.
    // (Nog steeds zonder werkbonnen.)
    const projectStops: Stop[] =
        projectGroups.map((g, index)=>({
            id:String(index),
            sortAt:g.sortAt,
            address:g.address
        }));

    const projectShare =
        await routeShareForStops(projectStops);

    for(const group of projectGroups){

        const km =
            projectShare.kmPerStop;

        // Bij meerdere monteurs/regels op hetzelfde adres:
        // elke regel krijgt de volledige project-km (per monteur).
        // Hier: één monteur, regels op zelfde project delen 1× de rit.
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
