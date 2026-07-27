import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/guard";



// De standaard formuliertypes. Deze worden eenmalig aangemaakt als de tabel
// nog leeg is. Later kan kantoor ze zelf beheren (toevoegen/verbergen).
const STANDAARD_TYPES = [
    {
        key:"uren",
        name:"Opleverformulier Uren",
        sortOrder:1
    },
    {
        key:"digital_signage",
        name:"Opleverformulier Digital Signage",
        sortOrder:2
    },
    {
        key:"evalue8",
        name:"Opleverdocument eValue8",
        sortOrder:3
    },
    {
        key:"plus_intake",
        name:"PLUS intake",
        sortOrder:4
    }
];




async function ensureStandaardTypes(){

    const aantal =
        await prisma.formType.count();

    if(aantal > 0){
        return;
    }

    for(const t of STANDAARD_TYPES){

        await prisma.formType.create({
            data:t
        });

    }

}




export async function GET(){


    try {


        const guard =
            await requireApiUser();

        if(!guard.ok){
            return guard.response;
        }



        await ensureStandaardTypes();



        const types =
            await prisma.formType.findMany({

                where:{
                    active:true
                },

                orderBy:{
                    sortOrder:"asc"
                }

            });



        return NextResponse.json(types);



    } catch(error){


        console.error(
            "FORM TYPES ERROR",
            error
        );


        return NextResponse.json(
            {
                error:"Formuliertypes ophalen mislukt"
            },
            {
                status:500
            }
        );


    }


}
