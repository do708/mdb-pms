import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";



function generateWorkorderNumber(){

    const year = new Date().getFullYear();

    const random =
        Math.floor(
            Math.random() * 9000
        ) + 1000;


    return `WB-${year}-${random}`;

}






export async function GET() {


    const workorders = await prisma.workorder.findMany({

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


}







export async function POST(

    request:Request

){


    try{


        const body =
            await request.json();

const project =
    await prisma.project.findUnique({

        where:{
            id: body.projectId
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


        const workorder =
            await prisma.workorder.create({

                data:{


                    number:
                        generateWorkorderNumber(),


                    title:
                        body.title,


                    description:
                        body.description || null,


                    projectId:
                        body.projectId,


                    assignedUserId:
                        body.assignedUserId || null,


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




    }catch(error){


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