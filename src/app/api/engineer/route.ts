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



        const tomorrow = new Date(today);


        tomorrow.setDate(
            tomorrow.getDate() + 1
        );





        const assignments =

            await prisma.assignment.findMany({

                where:{

                    plannedDate:{

                        gte: today

                    }

                },


                include:{


                    customer:true,


                    users:{

                        include:{

                            user:true

                        }

                    },


                    workorders:{

                        include:{

                            documents:true

                        }

                    }

                },


                orderBy:{

                    plannedDate:"asc"

                }

            });







        return NextResponse.json(

            assignments

        );





    } catch(error){



        console.error(

            "ENGINEER API ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Engineer opdrachten ophalen mislukt"

            },

            {

                status:500

            }

        );


    }


}