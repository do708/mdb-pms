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





        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const workorders = await prisma.workorder.findMany({
                where: {
                    assignedUserId: session.user.id,
                    plannedDate: { lt: tomorrow },
                    status: { notIn: ["uitgevoerd", "gefactureerd"] },
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
                "Engineer opdrachten ophalen mislukt"

            },

            {

                status:500

            }

        );


    }


}