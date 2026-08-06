import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiUser } from "@/lib/auth/guard";

import { getFormDefinition } from "@/constants/formDefinitions";

import { excludeArchivedForms } from "@/lib/archive";
import { sendFormSubmissionMail } from "@/lib/email/sendFormSubmissionMail";



export async function GET(){


    try {


        const guard =
            await requireApiUser();


        if(!guard.ok){

            return guard.response;

        }




        // Monteur ziet alleen eigen formulieren
        const engineerFilter =

            guard.user.role === "engineer"
            ?
            {
                userId:
                    guard.user.id,

                ...excludeArchivedForms()
            }
            :
            {
                ...excludeArchivedForms()
            };




        const forms =
            await prisma.formSubmission.findMany({

                where:engineerFilter,

                orderBy:{
                    createdAt:"desc"
                },

                select:{

                    id:true,

                    type:true,

                    title:true,

                    status:true,

                    createdAt:true,

                    user:{

                        select:{
                            name:true
                        }

                    }

                }

            });




        return NextResponse.json(
            forms
        );


    } catch(error){


        console.error(
            "FORMS GET ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Formulieren ophalen mislukt"
            },

            {
                status:500
            }

        );


    }


}




export async function POST(
    request:Request
){


    try {


        const guard =
            await requireApiUser();


        if(!guard.ok){

            return guard.response;

        }




        const body =
            await request.json();


        const definition =
            getFormDefinition(
                body.type
            );


        if(!definition){

            return NextResponse.json(

                {
                    error:"Onbekend formuliertype"
                },

                {
                    status:400
                }

            );

        }




        const date =
            new Date()
            .toLocaleDateString("nl-NL",{
                day:"2-digit",
                month:"2-digit",
                year:"numeric"
            });


        const title =
            `${definition.label} ${guard.user.name ?? ""}, ${date}`;




        const form =
            await prisma.formSubmission.create({

                data:{

                    type:
                        body.type,

                    title,

                    data:
                        body.data ?? {},

                    userId:
                        guard.user.id

                }

            });


        try {
            await sendFormSubmissionMail({
                formType: body.type,
                title,
                submitterName:
                    guard.user.name?.trim() ||
                    guard.user.email ||
                    "Onbekend",
                data:
                    (body.data && typeof body.data === "object"
                        ? body.data
                        : {}) as Record<string, unknown>,
            });
        } catch (mailError) {
            console.error(
                "FORM MAIL MISLUKT (formulier opgeslagen)",
                mailError
            );
        }




        return NextResponse.json(

            form,

            {
                status:201
            }

        );


    } catch(error){


        console.error(
            "FORMS POST ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Formulier opslaan mislukt"
            },

            {
                status:500
            }

        );


    }


}
