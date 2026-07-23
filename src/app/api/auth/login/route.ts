import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import bcrypt from "bcrypt";

import { setSession } from "@/lib/auth/session";







export async function POST(

    request: NextRequest

){


    try {


        const body =
            await request.json();





        const user =

            await prisma.user.findUnique({

                where:{

                    email:
                    body.email

                }

            });







        if(!user){


            return NextResponse.json(

                {

                    error:
                    "Ongeldige gegevens"

                },

                {

                    status:401

                }

            );


        }








        const passwordValid =

            await bcrypt.compare(

                body.password,

                user.password

            );







        if(!passwordValid){


            return NextResponse.json(

                {

                    error:
                    "Ongeldige gegevens"

                },

                {

                    status:401

                }

            );


        }








        setSession({

            id:
                user.id,


            name:
                user.name,


            email:
                user.email,


            role:
                user.role


        });








        return NextResponse.json({

            success:true,


            user:{

                id:
                    user.id,


                name:
                    user.name,


                email:
                    user.email,


                role:
                    user.role

            }

        });







    } catch(error){


        console.error(

            "LOGIN ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Inloggen mislukt"

            },

            {

                status:500

            }

        );


    }


}