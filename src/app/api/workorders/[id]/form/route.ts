import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireWorkorderAccess } from "@/lib/auth/guard";

import { mergeOpleverData } from "@/types/oplever";



export async function PUT(
    request:Request,
    context:{
        params:Promise<{
            id:string;
        }>
    }
){


    try {


        const { id } =
            await context.params;


        const guard =
            await requireWorkorderAccess(id);


        if(!guard.ok){

            return guard.response;

        }




        const body =
            await request.json();


        // Normaliseren zodat er nooit rommel in de database komt
        const formData =
            mergeOpleverData(
                body.formData
            );




        const workorder =
            await prisma.workorder.update({

                where:{
                    id
                },

                data:{
                    formData:
                        formData as object
                }

            });




        return NextResponse.json({

            success:true,

            formData:
                workorder.formData

        });


    } catch(error){


        console.error(
            "WORKORDER FORM ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Opleverformulier opslaan mislukt"
            },

            {
                status:500
            }

        );


    }


}
