import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";



export async function GET() {


    try {


        const customers = await prisma.customer.findMany({

            include:{

                _count:{

                    select:{

                        projects:true

                    }

                }

            },


            orderBy:{

                name:"asc"

            }

        });



        return NextResponse.json(

            customers

        );



    } catch(error){


        console.error(
            "CUSTOMERS GET ERROR",
            error
        );



        return NextResponse.json(

            {
                error:
                "Klanten ophalen mislukt"
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




        const customer =
            await prisma.customer.create({

                data:{


                    name:
                        body.name,


                    email:
                        body.email || null,


                    phone:
                        body.phone || null,


                    address:
                        body.address || null


                }

            });





        return NextResponse.json(

            customer,

            {

                status:201

            }

        );



    } catch(error){


        console.error(
            "CUSTOMER CREATE ERROR",
            error
        );



        return NextResponse.json(

            {

                error:
                "Klant aanmaken mislukt"

            },

            {

                status:500

            }

        );


    }


}