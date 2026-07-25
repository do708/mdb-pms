import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";





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
            ["ontvangen","afspraak","materiaal","ingepland"];




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








        return NextResponse.json({

            counters:{


                ingepland,


                uitgevoerd,


                teLaat:teLaatCount


            },


            teLaat,


            recent


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