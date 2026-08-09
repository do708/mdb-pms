import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";

import { mergeOpleverData, applyPlannedTravelToFormData } from "@/types/oplever";
import { parsePlanningDateInput } from "@/lib/datetime/amsterdam";






export async function GET(

    request:Request,

    {
        params
    }:{
        params: Promise<{
            id:string
        }>
    }

){


    try {


        const session =
            await auth();




        if(!session?.user?.id){


            return NextResponse.json(

                {
                    error:"Niet ingelogd"
                },

                {
                    status:401
                }

            );

        }





        const { id } =
            await params;





        const workorder =

            await prisma.workorder.findUnique({

                where:{

                    id

                },


                include:{


customer:true,

                    documents:true,

                    project:{

                        include:{

                            customer:true

                        }

                    },


                    assignedUser:true,


                    extraEngineers:{
                        include:{
                            user:{
                                select:{
                                    id:true,
                                    name:true
                                }
                            }
                        }
                    },


                    forms:{
                        include:{
                            formType:true
                        }
                    }


                }


            });







        if(!workorder){


            return NextResponse.json(

                {
                    error:"Werkbon niet gevonden"
                },

                {
                    status:404
                }

            );


        }








        if(

            session.user.role === "engineer"

            &&

            workorder.assignedUserId !== session.user.id

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








        const formDataForClient =
            applyPlannedTravelToFormData(
                workorder.formData,
                null,
                null
            );


        return NextResponse.json(

            {
                ...workorder,
                formData:formDataForClient
            }

        );





    } catch(error){


        console.error(

            "WORKORDER DETAIL ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Werkbon ophalen mislukt"

            },

            {

                status:500

            }

        );


    }


}









export async function PUT(

    request:Request,

    {
        params
    }:{
        params: Promise<{
            id:string
        }>
    }

){


    try {


        const session =
            await auth();





        if(!session?.user?.id){


            return NextResponse.json(

                {
                    error:"Niet ingelogd"
                },

                {
                    status:401
                }

            );

        }







        const { id } =
            await params;





        const existingWorkorder =

            await prisma.workorder.findUnique({

                where:{

                    id

                }

            });







        if(!existingWorkorder){


            return NextResponse.json(

                {
                    error:"Werkbon niet gevonden"
                },

                {
                    status:404
                }

            );


        }








        if(

            session.user.role === "engineer"

            &&

            existingWorkorder.assignedUserId !== session.user.id

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







        const body =
            await request.json();



        const workorder =

            await prisma.workorder.update({

                where:{

                    id

                },


                data:{


                    description:

                        body.description
                        ??
                        existingWorkorder.description,


                    werkInstructie:

                        body.werkInstructie !== undefined
                        ?
                        (body.werkInstructie || null)
                        :
                        existingWorkorder.werkInstructie,



                    formData:

                        body.formData !== undefined
                        ?
                        mergeOpleverData(body.formData) as object
                        :
                        (existingWorkorder.formData ?? undefined),



                    internalNotes:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.internalNotes
                        :
                        body.internalNotes
                        ??
                        existingWorkorder.internalNotes,



                    plannedDate:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.plannedDate
                        :
                        body.plannedDate !== undefined
                        ?
                        parsePlanningDateInput(body.plannedDate)
                        :
                        existingWorkorder.plannedDate,



                    plannedEndDate:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.plannedEndDate
                        :
                        body.plannedEndDate !== undefined
                        ?
                        (
                            body.plannedEndDate
                            ?
                            parsePlanningDateInput(body.plannedEndDate)
                            :
                            null
                        )
                        :
                        existingWorkorder.plannedEndDate,



                    plannedHours:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.plannedHours
                        :
                        body.plannedHours !== undefined
                        ?
                        (
                            body.plannedHours === null ||
                            body.plannedHours === ""
                            ?
                            null
                            :
                            Number(body.plannedHours)
                        )
                        :
                        existingWorkorder.plannedHours,



                    assignedUserId:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.assignedUserId
                        :
                        body.assignedUserId !== undefined
                        ?
                        (
                            body.assignedUserId || null
                        )
                        :
                        existingWorkorder.assignedUserId,



                    status:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.status
                        :
                        body.status
                        ??
                        existingWorkorder.status,



                    customerId:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.customerId
                        :
                        body.customerId !== undefined
                        ?
                        (body.customerId || null)
                        :
                        existingWorkorder.customerId,



                    location:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.location
                        :
                        body.location !== undefined
                        || body.straat !== undefined
                        || body.huisnummer !== undefined
                        ?
                        (
                            body.location
                            ||
                            [body.straat ?? existingWorkorder.straat, body.huisnummer ?? existingWorkorder.huisnummer]
                                .filter(Boolean)
                                .join(" ")
                                .trim()
                            ||
                            null
                        )
                        :
                        existingWorkorder.location,


                    straat:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.straat
                        :
                        body.straat !== undefined
                        ?
                        (body.straat || null)
                        :
                        existingWorkorder.straat,


                    huisnummer:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.huisnummer
                        :
                        body.huisnummer !== undefined
                        ?
                        (body.huisnummer || null)
                        :
                        existingWorkorder.huisnummer,


                    postcode:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.postcode
                        :
                        body.postcode !== undefined
                        ?
                        (body.postcode || null)
                        :
                        existingWorkorder.postcode,


                    city:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.city
                        :
                        body.city !== undefined
                        ?
                        (body.city || null)
                        :
                        existingWorkorder.city,


                    contactPersoon:

                        body.contactPersoon !== undefined
                        ?
                        (body.contactPersoon || null)
                        :
                        existingWorkorder.contactPersoon,


                    contactEmail:

                        body.contactEmail !== undefined
                        ?
                        (body.contactEmail || null)
                        :
                        existingWorkorder.contactEmail,


                    contactPhone:

                        body.contactPhone !== undefined
                        ?
                        (body.contactPhone || null)
                        :
                        existingWorkorder.contactPhone



                }


            });




        // Extra monteurs bijwerken (alleen kantoor/admin)
        if(
            session.user.role !== "engineer"
            &&
            Array.isArray(body.extraEngineerIds)
        ){

            await prisma.workorderEngineer.deleteMany({
                where:{
                    workorderId:id
                }
            });

            const unique =
                [...new Set(
                    body.extraEngineerIds.filter(
                        (uid:string)=>
                            uid && uid !== body.assignedUserId
                    )
                )] as string[];

            for(const uid of unique){
                await prisma.workorderEngineer.create({
                    data:{
                        workorderId:id,
                        userId:uid
                    }
                }).catch(()=>{});
            }

        }




        return NextResponse.json(

            workorder

        );






    } catch(error){


        console.error(

            "WORKORDER UPDATE ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Werkbon opslaan mislukt"

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


    // Alleen kantoor en admin mogen werkbonnen verwijderen.
    const guard =
        await requireApiRole(["admin","office"]);


    if(!guard.ok){

        return guard.response;

    }


    try {


        const { id } =
            await context.params;


        // Subtabellen (uren, materialen, foto's, handtekening,
        // hardware, documenten) verdwijnen mee via onDelete: Cascade.
        await prisma.workorder.delete({
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
            "WORKORDER DELETE ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Werkbon verwijderen mislukt"
            },

            {
                status:500
            }

        );


    }


}
