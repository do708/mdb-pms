import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";



export async function GET(){


    try {


        const today = new Date();


        today.setHours(
            0,
            0,
            0,
            0
        );





        const workorders =

            await prisma.workorder.findMany({

                where:{

                    plannedDate:{

                        gte: today

                    },


                    status:{

                        not:"afgerond"

                    }

                },


                include:{


                    project:{

                        include:{

                            customer:true

                        }

                    },


                    assignedUser:true


                },


                orderBy:{

                    plannedDate:"asc"

                }

            });







        return NextResponse.json(

            workorders

        );





    } catch(error){


        console.error(

            "ENGINEER API ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Engineer werkbonnen ophalen mislukt"

            },

            {

                status:500

            }

        );


    }


}