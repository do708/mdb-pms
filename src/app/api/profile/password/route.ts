import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

import { requireApiUser } from "@/lib/auth/guard";



export async function POST(
    request:Request
){


    try {


        const guard =
            await requireApiUser();


        if(!guard.ok){

            return guard.response;

        }




        const body =
            await request.json();


        const currentPassword =
            body.currentPassword;


        const newPassword =
            body.newPassword;




        if(
            !currentPassword ||
            !newPassword
        ){

            return NextResponse.json(

                {
                    error:"Vul beide wachtwoorden in"
                },

                {
                    status:400
                }

            );

        }




        if(newPassword.length < 8){

            return NextResponse.json(

                {
                    error:"Nieuw wachtwoord moet minimaal 8 tekens zijn"
                },

                {
                    status:400
                }

            );

        }




        const user =
            await prisma.user.findUnique({

                where:{
                    id:guard.user.id
                }

            });


        if(!user){

            return NextResponse.json(

                {
                    error:"Gebruiker niet gevonden"
                },

                {
                    status:404
                }

            );

        }




        const passwordValid =
            await bcrypt.compare(
                currentPassword,
                user.password
            );


        if(!passwordValid){

            return NextResponse.json(

                {
                    error:"Huidig wachtwoord is onjuist"
                },

                {
                    status:400
                }

            );

        }




        const hashed =
            await bcrypt.hash(
                newPassword,
                10
            );


        await prisma.user.update({

            where:{
                id:guard.user.id
            },

            data:{
                password:hashed
            }

        });




        return NextResponse.json({

            success:true

        });


    } catch(error){


        console.error(
            "PASSWORD CHANGE ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Wachtwoord wijzigen mislukt"
            },

            {
                status:500
            }

        );


    }


}
