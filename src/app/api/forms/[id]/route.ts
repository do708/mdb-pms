import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiUser, requireApiRole } from "@/lib/auth/guard";



export async function GET(
    request:Request,
    context:{
        params:Promise<{
            id:string;
        }>
    }
){


    try {


        const guard =
            await requireApiUser();


        if(!guard.ok){

            return guard.response;

        }




        const { id } =
            await context.params;


        const form =
            await prisma.formSubmission.findUnique({

                where:{
                    id
                },

                include:{

                    user:{

                        select:{
                            name:true
                        }

                    }

                }

            });


        if(!form){

            return NextResponse.json(

                {
                    error:"Formulier niet gevonden"
                },

                {
                    status:404
                }

            );

        }




        // Monteur mag alleen eigen formulieren inzien
        if(
            guard.user.role === "engineer"
            &&
            form.userId !== guard.user.id
        ){

            return NextResponse.json(

                {
                    error:"Geen toegang"
                },

                {
                    status:403
                }

            );

        }




        return NextResponse.json(
            form
        );


    } catch(error){


        console.error(
            "FORM DETAIL ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Formulier ophalen mislukt"
            },

            {
                status:500
            }

        );


    }


}



export async function DELETE(
    request:Request,
    context:{
        params:Promise<{
            id:string;
        }>
    }
){


    try {


        const guard =
            await requireApiUser();


        if(!guard.ok){

            return guard.response;

        }




        const { id } =
            await context.params;


        const form =
            await prisma.formSubmission.findUnique({
                where:{
                    id
                }
            });


        if(!form){

            return NextResponse.json(

                {
                    error:"Formulier niet gevonden"
                },

                {
                    status:404
                }

            );

        }




        // Monteur mag alleen eigen formulieren verwijderen;
        // admin/office mogen alles.
        const isOwner =
            form.userId === guard.user.id;

        const isManager =
            guard.user.role === "admin" ||
            guard.user.role === "office";


        if(!isOwner && !isManager){

            return NextResponse.json(

                {
                    error:"Geen toegang"
                },

                {
                    status:403
                }

            );

        }




        await prisma.formSubmission.delete({
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
            "FORM DELETE ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Formulier verwijderen mislukt"
            },

            {
                status:500
            }

        );


    }


}
