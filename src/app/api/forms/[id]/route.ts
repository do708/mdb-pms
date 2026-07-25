import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiUser } from "@/lib/auth/guard";



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
