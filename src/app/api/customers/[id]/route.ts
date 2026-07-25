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




        const projects =
            await prisma.project.count({
                where:{
                    customerId:id
                }
            });


        if(projects > 0){

            return NextResponse.json(

                {
                    error:
                        `Deze klant heeft nog ${projects} project(en). Verwijder of verplaats die eerst.`
                },

                {
                    status:400
                }

            );

        }




        await prisma.customer.delete({
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
            "CUSTOMER DELETE ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Klant verwijderen mislukt"
            },

            {
                status:500
            }

        );


    }


}
