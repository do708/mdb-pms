import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { requireApiUser } from "@/lib/auth/guard";



export async function GET() {


    try {

        const guard =
            await requireApiUser();

        if(!guard.ok){
            return guard.response;
        }



        // Iedereen (ook de monteur) mag de volledige klantenlijst zien,
        // zodat een monteur bij "werkbon invullen" elke opdrachtgever kan kiezen.
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

        const guard =
            await requireApiRole(["admin", "office"]);

        if(!guard.ok){
            return guard.response;
        }



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
                        body.address || null,


                    color:
                        body.color || "#2563eb"


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