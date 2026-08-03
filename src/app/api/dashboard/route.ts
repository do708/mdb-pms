import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";

import { excludeArchivedWorkorders, excludeArchivedForms } from "@/lib/archive";
import {
    leesKlaarzetMateriaal,
    heeftMateriaal,
    materiaalCompleet
} from "@/lib/klaarzetMateriaal";

import { volgendeWerkdag } from "@/lib/holidays";





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




        const recent =

            await prisma.workorder.findMany({

                take:10,

                where:{
                    ...excludeArchivedWorkorders()
                },


                orderBy:{

                    createdAt:"desc"

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




        // --- Materiaal-waarschuwing: klussen waarvoor NU (op de laatste
        //     werkdag vóór de klus) het klaargezet materiaal nog niet volledig
        //     is. De controle vindt 1 WERKDAG van tevoren plaats: op vrijdag
        //     waarschuwen we dus ook voor maandag-klussen (weekend + nationale
        //     feestdagen worden overgeslagen). ---
        const startMorgen =
            new Date(startVandaag);
        startMorgen.setDate(startMorgen.getDate() + 1);

        // De eerstvolgende werkdag ná vandaag. Voor een klus op die dag is
        // vandaag de laatste werkdag ervoor, dus nu moet de controle gebeuren.
        const volgWerkdag =
            volgendeWerkdag(startVandaag);

        // Venster loopt van morgen t/m (en inclusief) die volgende werkdag.
        const eindMorgen =
            new Date(volgWerkdag);
        eindMorgen.setDate(eindMorgen.getDate() + 1);


        const morgenKlussen =
            await prisma.workorder.findMany({

                where:{

                    plannedDate:{
                        gte:startMorgen,
                        lt:eindMorgen
                    },

                    status:{
                        in:NOG_IN_TE_VULLEN
                    }

                },

                orderBy:{
                    plannedDate:"asc"
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


        const materiaalWaarschuwing =
            morgenKlussen
            .filter(w=>{
                const km = leesKlaarzetMateriaal(w.formData);
                // Waarschuwen zodra er materiaal is dat nog niet compleet is.
                return heeftMateriaal(km) && !materiaalCompleet(km);
            })
            .map(w=>({
                id:w.id,
                number:w.number,
                title:w.title,
                plannedDate:w.plannedDate,
                customer:
                    w.customer?.name
                    ?? w.project?.customer?.name
                    ?? null,
                engineer:
                    w.assignedUser?.name ?? null
            }));




        return NextResponse.json({

            counters:{


                ingepland,


                uitgevoerd,


                teLaat:teLaatCount,


                openForms


            },


            materiaalWaarschuwing,


            teLaat,


            recent,


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