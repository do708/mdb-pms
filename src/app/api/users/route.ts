import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import bcrypt from "bcrypt";





export async function GET(){


    try {


        const users = await prisma.user.findMany({

            select:{

                id:true,

                name:true,

                email:true,

                role:true,

                active:true

            },


            orderBy:{

                name:"asc"

            }

        });



        return NextResponse.json(users);



    } catch(error){


        console.error(
            "USERS GET ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Gebruikers ophalen mislukt"
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



        const passwordHash =
            await bcrypt.hash(

                body.password,

                10

            );






        const user =
            await prisma.user.create({

                data:{

    name:
    body.name,

    email:
    body.email,

    password:
    passwordHash,

    role:
    body.role || "engineer",

    active:
    true

}

            });





       return NextResponse.json(

    {

        id:user.id,

        name:user.name,

        email:user.email,

        role:user.role,

        active:user.active

    },

    {

        status:201

    }

);



    } catch(error){


        console.error(

            "USER CREATE ERROR",

            error

        );


        return NextResponse.json(

            {

                error:
                "Gebruiker aanmaken mislukt"

            },

            {

                status:500

            }

        );


    }


}