import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole, requireApiUser } from "@/lib/auth/guard";



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



// Eén klant ophalen (voor het wijzigen-scherm)
export async function GET(
    request:Request,
    context:{
        params:Promise<{
            id:string;
        }>
    }
){

    const guard =
        await requireApiUser();

    if(!guard.ok){
        return guard.response;
    }

    try {

        const { id } =
            await context.params;

        const customer =
            await prisma.customer.findUnique({
                where:{ id }
            });

        if(!customer){
            return NextResponse.json(
                { error:"Klant niet gevonden" },
                { status:404 }
            );
        }

        return NextResponse.json(customer);

    } catch(error){

        console.error("CUSTOMER GET ERROR", error);

        return NextResponse.json(
            { error:"Ophalen mislukt" },
            { status:500 }
        );

    }

}



// Klantgegevens wijzigen (kantoor/admin): naam, contact, kleur
export async function PUT(
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

        const body =
            await request.json();

        const customer =
            await prisma.customer.update({

                where:{ id },

                data:{
                    name:body.name,
                    email:body.email || null,
                    phone:body.phone || null,
                    address:body.address || null,
                    color:body.color || "#2563eb"
                }

            });

        return NextResponse.json(customer);

    } catch(error){

        console.error("CUSTOMER PUT ERROR", error);

        return NextResponse.json(
            { error:"Wijzigen mislukt" },
            { status:500 }
        );

    }

}
