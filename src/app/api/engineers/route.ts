import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiUser } from "@/lib/auth/guard";



// Lichte lijst van actieve monteurs, voor selectievelden.
// Bewust geen e-mailadressen of andere gegevens.

export async function GET(){


    try {


        const guard =
            await requireApiUser();


        if(!guard.ok){

            return guard.response;

        }




        const engineers =
            await prisma.user.findMany({

                where:{

                    role:"engineer",

                    active:true

                },

                select:{

                    id:true,

                    name:true

                },

                orderBy:{
                    name:"asc"
                }

            });




        return NextResponse.json(
            engineers
        );


    } catch(error){


        console.error(
            "ENGINEERS GET ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Monteurs ophalen mislukt"
            },

            {
                status:500
            }

        );


    }


}
