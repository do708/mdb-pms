import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiUser } from "@/lib/auth/guard";
import {
    defaultPlanningEventRange,
    expandPlanningEvents,
} from "@/lib/planning/expandPlanningEvents";



export async function GET(){


    try {


        const guard =
            await requireApiUser();


        if(!guard.ok){

            return guard.response;

        }




        // Monteur ziet alleen zijn eigen planning
        const engineerFilter =

            guard.user.role === "engineer"
            ?
            {
                // Eigen klussen: als hoofdmonteur OF als extra monteur
                OR:[
                    {
                        assignedUserId:
                            guard.user.id
                    },
                    {
                        extraEngineers:{
                            some:{
                                userId:
                                    guard.user.id
                            }
                        }
                    }
                ]
            }
            :
            {};




        // Zelfde ±3 mnd-venster als agenda-expansie; geen formData/pdfData
        // (PDF-bytes zouden de response met elke afgeronde werkbon exploderen).
        const { rangeStart, rangeEnd } = defaultPlanningEventRange();

        const workorders =

            await prisma.workorder.findMany({

                where:{

                    ...engineerFilter,

                    plannedDate:{
                        gte: rangeStart,
                        lte: rangeEnd,
                    }

                },


                orderBy:{
                    plannedDate:"asc"
                },

                omit: {
                    formData: true,
                    aanvraagSpecificaties: true,
                    pdfData: true,
                },

                include:{

                    customer:true,

                    project:{

                        include:{
                            customer:true
                        }

                    },

                    assignedUser:true,

                    extraEngineers:{
                        include:{
                            user:{
                                select:{
                                    id:true,
                                    name:true
                                }
                            }
                        }
                    }

                }

            });




        // Geaccepteerde verlofaanvragen -> als blokkades in de planning
        const leaveForms =
            await prisma.formSubmission.findMany({

                where:{
                    type:"verlof",
                    status:"geaccepteerd",
                    ...(
                        guard.user.role === "engineer"
                        ?
                        { userId:guard.user.id }
                        :
                        {}
                    )
                },

                include:{
                    user:{
                        select:{
                            id:true,
                            name:true
                        }
                    }
                }

            });


        // Omzetten naar simpele leave-objecten met datumbereik
        const leave =
            leaveForms.map(f=>{

                const data =
                    (f.data ?? {}) as Record<string,unknown>;

                return {
                    id:f.id,
                    userId:f.user.id,
                    userName:f.user.name,
                    from:(data.eersteDag as string) ?? null,
                    to:(data.laatsteDag as string) ?? null,
                    type:(data.typeVerlof as string) ?? "Verlof"
                };

            })
            .filter(l=>l.from);


        // Vrije agenda-items: kantoor ziet alles; monteur alleen toegewezen
        const eventMasters =
            await prisma.planningEvent.findMany({
                where:
                    guard.user.role === "engineer"
                    ?
                    { assignedUserId: guard.user.id }
                    :
                    {},
                orderBy: { startAt: "asc" },
                include: {
                    assignedUser: {
                        select: { id: true, name: true },
                    },
                    createdBy: {
                        select: { id: true, name: true },
                    },
                },
            });

        const events = expandPlanningEvents(
            eventMasters,
            rangeStart,
            rangeEnd
        );


        return NextResponse.json({
            workorders,
            leave,
            events,
        });


    } catch(error){


        console.error(
            "PLANNING ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Planning ophalen mislukt"
            },

            {
                status:500
            }

        );


    }


}
