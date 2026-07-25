import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";

import { mergeOpleverData } from "@/types/oplever";





function generateWorkorderNumber(){


    const year =
        new Date().getFullYear();



    const random =
        Math.floor(
            Math.random() * 9000
        ) + 1000;



    return `WB-${year}-${random}`;

}








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





        const role =
            session.user.role;





        const where =

            role === "engineer"

            ?

            {

                assignedUserId:
                    session.user.id

            }

            :

            {};








        const workorders =

            await prisma.workorder.findMany({


                where,



                include:{


                    project:{

                        include:{

                            customer:true

                        }

                    },

                    customer:true,


                    assignedUser:true


                },



                orderBy:{


                    createdAt:"desc"


                }


            });







        return NextResponse.json(

            workorders

        );





    } catch(error){


        console.error(

            "GET WORKORDERS ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Werkbonnen ophalen mislukt"

            },

            {

                status:500

            }

        );


    }


}









export async function POST(

    request:Request

){


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





        const body =
            await request.json();





        // Klant is optioneel maar aanbevolen; controleren als hij is meegegeven
        if(body.customerId){

            const customer =
                await prisma.customer.findUnique({
                    where:{
                        id:body.customerId
                    }
                });

            if(!customer){

                return NextResponse.json(
                    {
                        error:"Gekozen opdrachtgever bestaat niet"
                    },
                    {
                        status:400
                    }
                );

            }

        }







        let assignedUserId =
            body.assignedUserId || null;





        // Monteur mag alleen zichzelf gebruiken

        if(session.user.role === "engineer"){


            assignedUserId =
                session.user.id;


        }








        const workorder =

            await prisma.workorder.create({

                data:{


                    number:
                        generateWorkorderNumber(),



                    title:
                        body.title,



                    description:
                        body.description || null,



                    internalNotes:
                        body.internalNotes || null,



                    formData:
                        body.formData
                        ?
                        mergeOpleverData(
                            body.formData
                        ) as object
                        :
                        undefined,



                    projectId:
                        body.projectId || null,



                    customerId:
                        body.customerId || null,



                    location:
                        body.location || null,



                    assignedUserId,



                    plannedDate:

                        body.plannedDate

                        ?

                        new Date(body.plannedDate)

                        :

                        null,



                    status:
                        body.status || "ontvangen"


                }


            });








        return NextResponse.json(

            workorder,

            {

                status:201

            }

        );





    } catch(error){


        console.error(

            "CREATE WORKORDER ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Werkbon aanmaken mislukt"

            },

            {

                status:500

            }

        );


    }


}