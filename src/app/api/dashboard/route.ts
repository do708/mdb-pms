import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";

import { excludeArchivedWorkorders, excludeArchivedForms } from "@/lib/archive";
import {
    moetOpMateriaalControle,
} from "@/lib/klaarzetMateriaal";





export async function GET(){


    const guard = await requireApiRole(["admin","office"]);
    if(!guard.ok) return guard.response;



    try {


        // Vandaag om middernacht: alles daarvoor is "verstreken"
        const startVandaag =
            new Date();

        startVandaag.setHours(0,0,0,0);


        // Statussen waarin de werkbon nog door de monteur ingevuld moet worden
        const NOG_IN_TE_VULLEN =
            ["ontvangen","afspraak","ingepland"];




        const ingepland =

            await prisma.workorder.count({

                where:{

                    status:"ingepland"

                }

            });




        const uitgevoerd =

            await prisma.workorder.count({

                where:{

                    status:"uitgevoerd"

                }

            });




        // Rood: klaargezet, datum verstreken, nog niet ingevuld
        const teLaatWhere = {

            plannedDate:{

                lt:startVandaag

            },

            status:{

                in:NOG_IN_TE_VULLEN

            }

        };


        const teLaatCount =

            await prisma.workorder.count({

                where:teLaatWhere

            });


        const teLaat =

            await prisma.workorder.findMany({

                where:teLaatWhere,

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

                    assignedUser:true

                }

            });




        const uitgevoerdLijst =

            await prisma.workorder.findMany({

                where:{
                    status:"uitgevoerd"
                },


                orderBy:[
                    { sentAt:"desc" },
                    { workDate:"desc" },
                    { updatedAt:"desc" }
                ],

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


                    assignedUser:true


                }


            });








        const recentForms =

            await prisma.formSubmission.findMany({

                take:10,

                where:{
                    ...excludeArchivedForms()
                },

                orderBy:{
                    createdAt:"desc"
                },

                include:{

                    user:{
                        select:{
                            name:true
                        }
                    }

                }

            });


        const openForms =
            await prisma.formSubmission.count({
                where:{
                    status:"ingediend"
                }
            });

        const openFormsList =
            await prisma.formSubmission.findMany({
                where:{
                    status:"ingediend"
                },
                orderBy:{
                    createdAt:"desc"
                },
                include:{
                    user:{
                        select:{
                            name:true
                        }
                    }
                }
            });

        const openAanvragen =
            await prisma.aanvraag.count({
                where:{
                    status:"open"
                }
            });




        // Alle ingeplande klussen met open/leeg materiaal (ook over 1–2 weken).
        const ingeplandKlussen =
            await prisma.workorder.findMany({
                where: {
                    status: "ingepland",
                    ...excludeArchivedWorkorders(),
                },
                orderBy: {
                    plannedDate: "asc",
                },
                omit: {
                    pdfData: true,
                },
                include: {
                    customer: true,
                    project: {
                        include: {
                            customer: true,
                        },
                    },
                    assignedUser: true,
                },
            });

        const materiaalWaarschuwing =
            ingeplandKlussen
                .filter((w) =>
                    moetOpMateriaalControle(
                        w.formData,
                        w.aanvraagSpecificaties
                    )
                )
                .map((w) => ({
                    id: w.id,
                    number: w.number,
                    title: w.title,
                    plannedDate: w.plannedDate,
                    customer:
                        w.customer?.name
                        ?? w.project?.customer?.name
                        ?? null,
                    engineer: w.assignedUser?.name ?? null,
                }));


        return NextResponse.json({

            counters:{


                ingepland,


                uitgevoerd,


                teLaat:teLaatCount,


                openForms,


                openAanvragen,


                materiaal:materiaalWaarschuwing.length,


            },


            materiaalWaarschuwing,


            teLaat,


            openFormsList,


            uitgevoerdLijst,


            recentForms


        });







    } catch(error){


        console.error(

            "DASHBOARD API ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Dashboard gegevens ophalen mislukt"

            },

            {

                status:500

            }

        );


    }


}