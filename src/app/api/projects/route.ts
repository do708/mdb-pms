import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";



function generateProjectNumber(){

    const year = new Date().getFullYear();

    const random =
        Math.floor(
            Math.random() * 9000
        ) + 1000;


    return `PR-${year}-${random}`;

}






export async function GET(){


    try {


        const projects = await prisma.project.findMany({

            include:{

                customer:true

            },


            orderBy:{

                createdAt:"desc"

            }

        });



        return NextResponse.json(

            projects

        );



    } catch(error){


        console.error(

            "PROJECTS GET ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Projecten ophalen mislukt"

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


        const body =
            await request.json();




        const project =
            await prisma.project.create({

                data:{


                    number:
                    generateProjectNumber(),


                    name:
                    body.name,


                    customerId:
                    body.customerId,


                    status:
                    "new"


                }

            });





        return NextResponse.json(

            project,

            {

                status:201

            }

        );



    } catch(error){


        console.error(

            "PROJECT CREATE ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Project aanmaken mislukt"

            },

            {

                status:500

            }

        );


    }


}