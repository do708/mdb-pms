import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiUser, requireApiRole } from "@/lib/auth/guard";
import {
    leaveDaysFromData,
    parseTotaalUren,
    vacationBalanceForUser,
    vacationDaysForRequest,
    vacationItemsFromForms,
    yearFromDateKey,
} from "@/lib/reports/vacation";



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
                            id:true,
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




        let vacation = null;
        let thisRequestDays = 0;

        if (form.type === "verlof") {
            const data = (form.data ?? {}) as Record<string, unknown>;
            const range = leaveDaysFromData(data);
            const year = yearFromDateKey(range?.from);
            const vacationForms =
                await prisma.formSubmission.findMany({
                    where: {
                        type: "verlof",
                        userId: form.userId,
                        status: {
                            in: ["geaccepteerd", "ingediend"],
                        },
                    },
                    select: {
                        status: true,
                        data: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                });
            vacation = vacationBalanceForUser(
                vacationItemsFromForms(vacationForms),
                form.userId,
                year
            );
            thisRequestDays = range
                ? vacationDaysForRequest(
                      range.from,
                      range.to,
                      year,
                      parseTotaalUren(data.totaalUren)
                  )
                : 0;
        }

        return NextResponse.json({
            ...form,
            vacation,
            thisRequestDays,
        });


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



// Kantoor/admin wijzigt de status van een formulier.
//   verlof:     ingediend -> geaccepteerd / afgewezen
//   declaratie: ingediend -> behandeld
//   (andere types: vrije status)

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


        const status =
            String(body.status || "").trim();


        if(!status){

            return NextResponse.json(
                {
                    error:"Geen status meegegeven"
                },
                {
                    status:400
                }
            );

        }


        const existing =
            await prisma.formSubmission.findUnique({
                where:{
                    id
                },
                select:{
                    data:true
                }
            });

        if(!existing){
            return NextResponse.json(
                {
                    error:"Formulier niet gevonden"
                },
                {
                    status:404
                }
            );
        }

        const current =
            existing.data &&
            typeof existing.data === "object" &&
            !Array.isArray(existing.data)
                ? (existing.data as Record<string, unknown>)
                : {};

        const form =
            await prisma.formSubmission.update({

                where:{
                    id
                },

                data: {
                    status,
                    ...(
                        status === "geaccepteerd" &&
                        typeof body.aftrekVakantie === "boolean"
                            ? {
                                data: {
                                    ...current,
                                    aftrekVakantie: body.aftrekVakantie,
                                } as object,
                            }
                            : {}
                    ),
                }

            });


        return NextResponse.json(form);


    } catch(error){


        console.error(
            "FORM STATUS ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Status wijzigen mislukt"
            },

            {
                status:500
            }

        );


    }


}
