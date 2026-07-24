import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { requireApiUser } from "@/lib/auth/guard";



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

        const guard =
            await requireApiUser();

        if(!guard.ok){
            return guard.response;
        }



        // Monteur ziet alleen projecten met een eigen werkbon
        const engineerFilter =
            guard.user.role === "engineer"
            ?
            {
                workorders:{
                    some:{
                        assignedUserId:guard.user.id
                    }
                }
            }
            :
            {};


        const projects = await prisma.project.findMany({

            where:engineerFilter,


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

        const guard =
            await requireApiRole(["admin", "office"]);

        if(!guard.ok){
            return guard.response;
        }



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