import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";



export async function DELETE(
    request:Request,
    context:{
        params:Promise<{
            id:string;
        }>
    }
){


    const guard =
        await requireApiRole(["admin","office"]);


    if(!guard.ok){

        return guard.response;

    }


    try {


        const { id } =
            await context.params;




        const workorders =
            await prisma.workorder.count({
                where:{
                    projectId:id
                }
            });


        if(workorders > 0){

            return NextResponse.json(

                {
                    error:
                        `Dit project heeft nog ${workorders} werkbon(nen). Verwijder die eerst.`
                },

                {
                    status:400
                }

            );

        }




        await prisma.project.delete({
            where:{
                id
            }
        });


        return NextResponse.json({
            success:true,
            deleted:true
        });


    } catch(error){


        console.error(
            "PROJECT DELETE ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Project verwijderen mislukt"
            },

            {
                status:500
            }

        );


    }


}
