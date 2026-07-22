import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";



export async function GET(){


    try {


        const workorders = await prisma.workorder.findMany({

            where:{

                plannedDate:{

                    not:null

                }

            },


            orderBy:{

                plannedDate:"asc"

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




        return NextResponse.json(

            workorders

        );



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