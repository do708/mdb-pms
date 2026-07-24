import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";





export async function GET(){


    const guard = await requireApiRole(["admin","office"]);
    if(!guard.ok) return guard.response;



    try {


        const open =

            await prisma.workorder.count({

                where:{

                    status:"open"

                }

            });





        const inProgress =

            await prisma.workorder.count({

                where:{

                    status:"in_uitvoering"

                }

            });







        const completed =

            await prisma.workorder.count({

                where:{

                    status:"afgerond"

                }

            });








        const recent =

            await prisma.workorder.findMany({

                take:10,


                orderBy:{

                    createdAt:"desc"

                },


                include:{


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


                open,


                inProgress,


                completed


            },


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