import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";





export async function GET(

    request: NextRequest,

    context:{
        params:Promise<{
            id:string;
        }>
    }

){


    try {


        const { id } =
            await context.params;





        const user =

            await prisma.user.findUnique({

                where:{

                    id

                },

                select:{

                    id:true,

                    name:true,

                    email:true,

                    role:true,

                    active:true

                }

            });







        if(!user){


            return NextResponse.json(

                {

                    error:
                    "Gebruiker niet gevonden"

                },

                {

                    status:404

                }

            );


        }







        return NextResponse.json(user);







    } catch(error){


        console.error(

            "USER GET ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Gebruiker ophalen mislukt"

            },

            {

                status:500

            }

        );


    }


}









export async function PUT(

    request: NextRequest,

    context:{
        params:Promise<{
            id:string;
        }>
    }

){


    try {


        const { id } =
            await context.params;





        const body =
            await request.json();







        const user =

            await prisma.user.update({

                where:{

                    id

                },


                data:{

                    name:
                        body.name,


                    email:
                        body.email,


                    role:
                        body.role,


                    active:
                        body.active

                },


                select:{

                    id:true,

                    name:true,

                    email:true,

                    role:true,

                    active:true

                }

            });








        return NextResponse.json({

            success:true,

            user

        });







    } catch(error){


        console.error(

            "USER UPDATE ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Gebruiker aanpassen mislukt"

            },

            {

                status:500

            }

        );


    }


}