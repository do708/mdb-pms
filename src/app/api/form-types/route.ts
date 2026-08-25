import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/guard";



// De standaard formuliertypes. Deze worden eenmalig aangemaakt als de tabel
// nog leeg is. Later kan kantoor ze zelf beheren (toevoegen/verbergen).
const STANDAARD_TYPES = [
    {
        key:"uren",
        name:"Uren",
        sortOrder:1
    },
    {
        key:"digital_signage",
        name:"Digital Signage",
        sortOrder:2
    },
    {
        key:"evalue8",
        name:"eValue8",
        sortOrder:3
    }
];




async function ensureStandaardTypes(){

    // Voegt ontbrekende standaardtypes toe en houdt naam/volgorde gelijk aan
    // de standaardlijst (ook als de tabel al bestaat).
    for(const t of STANDAARD_TYPES){

        const bestaat =
            await prisma.formType.findUnique({
                where:{ key:t.key }
            });

        if(!bestaat){
            await prisma.formType.create({
                data:t
            });
        } else if(
            bestaat.name !== t.name ||
            bestaat.sortOrder !== t.sortOrder
        ){
            await prisma.formType.update({
                where:{ key:t.key },
                data:{
                    name:t.name,
                    sortOrder:t.sortOrder
                }
            });
        }

    }

    await prisma.formType.updateMany({
        where: {
            key: {
                in: [
                    "plus_intake",
                    "plus_oplevering",
                    "uren",
                    "digital_signage",
                    "evalue8"
                ]
            }
        },
        data: { active: false }
    });

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
