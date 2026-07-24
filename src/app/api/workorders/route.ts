import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";





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





        const project =

            await prisma.project.findUnique({

                where:{

                    id:body.projectId

                }

            });





        if(!project){


            return NextResponse.json(

                {

                    error:
                    "Gekozen project bestaat niet"

                },

                {

                    status:400

                }

            );


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



                    projectId:
                        body.projectId,



                    assignedUserId,



                    plannedDate:

                        body.plannedDate

                        ?

                        new Date(body.plannedDate)

                        :

                        null,



                    status:
                        "open"


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