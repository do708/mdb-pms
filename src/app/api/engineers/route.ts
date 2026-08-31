import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiUser } from "@/lib/auth/guard";



// Lichte monteurslijst voor selectievelden en planning.
// Bewust geen e-mailadressen of andere gegevens.
// `active` = mag inloggen; standaard alleen accounts die mogen inloggen.
// Planning vraagt ?includeInactive=1 zodat uitgeschakelde login
// de monteur-kolom en historische opdrachten niet wegfiltert.

export async function GET(request: Request){


    try {


        const guard =
            await requireApiUser();


        if(!guard.ok){

            return guard.response;

        }


        const includeInactive =
            new URL(request.url).searchParams.get("includeInactive") ===
            "1";


        // Volledige monteurslijst: nodig voor o.a. projecturen (boeken voor
        // collega's). Planning filtert client-side op eigen rij voor monteurs.
        const engineers =
            await prisma.user.findMany({

                where:{

                    role:"engineer",

                    ...(includeInactive ? {} : { active: true }),

                },

                select:{

                    id:true,

                    name:true,

                    staffKind:true,

                    stagiaireUntil:true,

                    active:true,

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
