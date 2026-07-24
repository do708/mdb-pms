import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { requireApiUser } from "@/lib/auth/guard";





export async function GET(

    request: NextRequest,

    context:{
        params: Promise<{
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



        const { id } = await context.params;





        const assignment = await prisma.assignment.findUnique({

            where:{
                id
            },


            include:{


                customer:true,


                users:{

                    include:{

                        user:true

                    }

                },


                workorders:{

                    include:{

                        documents:true,

                        photos:true,

                        signature:true

                    }

                },


                invoices:true


            }


        });







        if(!assignment){


            return NextResponse.json(

                {

                    error:"Opdracht niet gevonden"

                },

                {

                    status:404

                }

            );

        }







        return NextResponse.json(

            assignment

        );






    } catch(error){



        console.error(

            "ASSIGNMENT DETAIL ERROR",

            error

        );



        return NextResponse.json(

            {

                error:"Opdracht ophalen mislukt"

            },

            {

                status:500

            }

        );


    }


}






export async function PUT(

    request:NextRequest,

    context:{
        params:Promise<{
            id:string;
        }>
    }

){


    try {

        const guard =
            await requireApiRole(["admin", "office"]);

        if(!guard.ok){
            return guard.response;
        }



        const { id } = await context.params;



        const body = await request.json();





        const assignment = await prisma.assignment.update({

            where:{
                id
            },


            data:{


                status:
                    body.status,


                internalNotes:
                    body.internalNotes,


                plannedDate:
                    body.plannedDate

                        ? new Date(body.plannedDate)

                        : undefined


            }


        });





        return NextResponse.json(

            assignment

        );





    } catch(error){


        console.error(

            "ASSIGNMENT UPDATE ERROR",

            error

        );



        return NextResponse.json(

            {

                error:"Opdracht aanpassen mislukt"

            },

            {

                status:500

            }

        );


    }


}