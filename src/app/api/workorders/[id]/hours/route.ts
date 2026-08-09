import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireWorkorderAccess } from "@/lib/auth/guard";



export async function POST(

    request: NextRequest,

    context:{
        params: Promise<{
            id:string;
        }>
    }

){


    try {


        const { id } =
            await context.params;

        const guard =
            await requireWorkorderAccess(id);

        if(!guard.ok){
            return guard.response;
        }




        const body =
            await request.json();





        const workorder =
            await prisma.workorder.findUnique({

                where:{
                    id
                }

            });





        if(!workorder){


            return NextResponse.json(

                {
                    error:
                    "Opdracht niet gevonden"
                },

                {
                    status:404
                }

            );

        }







        const hour =
            await prisma.workorderHour.create({

                data:{


                    workorderId:id,


                    date:
                        body.date
                        ?
                        new Date(body.date)
                        :
                        new Date(),


                    hours:
                        Number(
                            body.hours || 0
                        ),


                    travelTime:
                        Number(
                            body.travelTime || 0
                        ),


                    kilometers:
                        Number(
                            body.kilometers || 0
                        ),


                    hotel:
                        Boolean(
                            body.hotel
                        )


                }

            });







        return NextResponse.json(

            {

                success:true,

                hour

            },

            {

                status:201

            }

        );





    } catch(error){


        console.error(

            "CREATE HOURS ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Uren opslaan mislukt"

            },

            {

                status:500

            }

        );


    }


}







export async function GET(

    request:NextRequest,

    context:{
        params:Promise<{
            id:string;
        }>
    }

){


    try {


        const { id } =
            await context.params;

        const guard =
            await requireWorkorderAccess(id);

        if(!guard.ok){
            return guard.response;
        }




        const hours =
            await prisma.workorderHour.findMany({

                where:{

                    workorderId:id

                },


                orderBy:{

                    date:"asc"

                }

            });





        return NextResponse.json(hours);



    } catch(error){


        console.error(

            "GET HOURS ERROR",

            error

        );


        return NextResponse.json(

            {
                error:
                "Uren ophalen mislukt"
            },

            {
                status:500
            }

        );

    }


}