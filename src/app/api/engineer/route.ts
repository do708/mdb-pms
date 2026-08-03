import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";



export async function GET(){


    try {


        const session =
            await auth();




        if(!session?.user?.id){


            return NextResponse.json(

                {
                    error:"Niet ingelogd"
                },

                {
                    status:401
                }

            );

        }





        const today =
            new Date();


        today.setHours(
            0,
            0,
            0,
            0
        );






        const workorders =

            await prisma.workorder.findMany({

                where:{


                    assignedUserId:
                        session.user.id,


                    plannedDate:{

                        gte:today

                    },


                    status:{

                        notIn:["uitgevoerd","gefactureerd","afgerond"]

                    }

                },


                include:{


                    customer:true,


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