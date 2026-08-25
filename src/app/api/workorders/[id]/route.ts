import { NextResponse, after } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";

import { migrateStatus } from "@/constants/workorderStatus";
import { archiveWorkorderToNas } from "@/lib/archive/archiveWorkorderToNas";
import { isNasArchiveEnabled } from "@/lib/nas/synologyConfig";

import { mergeOpleverData, applyPlannedTravelToFormData } from "@/types/oplever";

import { syncEngineerDayKilometers } from "@/lib/travel/syncEngineerDayKilometers";
import { parsePlanningDateInput } from "@/lib/datetime/amsterdam";
import { ontbrekendeVerplichteLocatieVelden } from "@/lib/workorders/address";
import { parseOpleverModules } from "@/lib/workorders/opleverModules";
import { syncWorkorderForms } from "@/lib/workorders/syncForms";





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
                    error:"Opdracht niet gevonden"
                },

                {
                    status:404
                }

            );


        }








        const isAssignedEngineer =
            workorder.assignedUserId === session.user.id
            ||
            workorder.extraEngineers.some(
                (extra) => extra.userId === session.user.id
            );

        if(

            session.user.role === "engineer"

            &&

            !isAssignedEngineer

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








        if(
            workorder.plannedDate
            && workorder.assignedUserId
            && (
                workorder.plannedRoundTripKm
                == null
                || workorder.plannedReisuren
                == null
            )
        ){

            await syncEngineerDayKilometers(
                workorder.assignedUserId,
                workorder.plannedDate
            );

            const travel =
                await prisma.workorder.findUnique({
                    where:{
                        id
                    },
                    select:{
                        plannedRoundTripKm:true,
                        plannedReisuren:true
                    }
                });

            if(travel){
                workorder.plannedRoundTripKm =
                    travel.plannedRoundTripKm;
                workorder.plannedReisuren =
                    travel.plannedReisuren;
            }

        }


        const formDataForClient =
            applyPlannedTravelToFormData(
                workorder.formData,
                workorder.plannedRoundTripKm,
                workorder.plannedReisuren
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
                "Opdracht ophalen mislukt"

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

                },

                include:{
                    extraEngineers:{
                        select:{
                            userId:true
                        }
                    }
                }

            });







        if(!existingWorkorder){


            return NextResponse.json(

                {
                    error:"Opdracht niet gevonden"
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


        if(session.user.role !== "engineer"){
            const locatieWordtBewerkt =
                body.title !== undefined
                || body.customerId !== undefined
                || body.straat !== undefined
                || body.huisnummer !== undefined
                || body.city !== undefined
                || body.contactPersoon !== undefined;

            if(locatieWordtBewerkt){
                const locatieFout = ontbrekendeVerplichteLocatieVelden({
                    customerId:
                        body.customerId !== undefined
                        ? body.customerId
                        : existingWorkorder.customerId,
                    title:
                        body.title !== undefined
                        ? body.title
                        : existingWorkorder.title,
                    straat:
                        body.straat !== undefined
                        ? body.straat
                        : existingWorkorder.straat,
                    huisnummer:
                        body.huisnummer !== undefined
                        ? body.huisnummer
                        : existingWorkorder.huisnummer,
                    city:
                        body.city !== undefined
                        ? body.city
                        : existingWorkorder.city,
                    contactPersoon:
                        body.contactPersoon !== undefined
                        ? body.contactPersoon
                        : existingWorkorder.contactPersoon,
                });

                if(locatieFout){
                    return NextResponse.json(
                        { error: locatieFout },
                        { status: 400 }
                    );
                }
            }
        }



        const planningFieldsChanged =
            session.user.role !== "engineer"
            && (
                body.plannedDate !== undefined
                || body.location !== undefined
                || body.straat !== undefined
                || body.huisnummer !== undefined
                || body.postcode !== undefined
                || body.city !== undefined
                || body.customerId !== undefined
                || body.assignedUserId !== undefined
            );

        const previousEngineerId =
            existingWorkorder.assignedUserId;

        const previousPlannedDate =
            existingWorkorder.plannedDate;



        const workorder =

            await prisma.workorder.update({

                where:{

                    id

                },


                data:{


                    title:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.title
                        :
                        body.title !== undefined
                        ?
                        body.title
                        :
                        existingWorkorder.title,


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
                        mergeOpleverData({
                            ...(
                                existingWorkorder.formData
                                &&
                                typeof existingWorkorder.formData === "object"
                                ?
                                existingWorkorder.formData as object
                                :
                                {}
                            ),
                            ...(
                                body.formData
                                &&
                                typeof body.formData === "object"
                                ?
                                body.formData as object
                                :
                                {}
                            )
                        }) as object
                        :
                        (existingWorkorder.formData ?? undefined),

                    opleverModules:
                        body.opleverModules !== undefined
                        ?
                        parseOpleverModules(body.opleverModules)
                        :
                        existingWorkorder.opleverModules ?? undefined,



                    internalNotes:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.internalNotes
                        :
                        body.internalNotes
                        ??
                        existingWorkorder.internalNotes,



                    onHoldNotes:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.onHoldNotes
                        :
                        body.onHoldNotes !== undefined
                        ?
                        (
                            typeof body.onHoldNotes === "string" &&
                            body.onHoldNotes.trim()
                            ?
                            body.onHoldNotes.trim()
                            :
                            null
                        )
                        :
                        existingWorkorder.onHoldNotes,



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
        let nextExtraIds: string[] =
            existingWorkorder.extraEngineers.map(
                (e)=>e.userId
            );

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
                            uid
                            && uid !== (
                                body.assignedUserId
                                ?? workorder.assignedUserId
                            )
                    )
                )] as string[];

            nextExtraIds = unique;

            for(const uid of unique){
                await prisma.workorderEngineer.create({
                    data:{
                        workorderId:id,
                        userId:uid
                    }
                }).catch(()=>{});
            }

        }


        await syncWorkorderForms(id, body.formTypeIds);


        if(
            planningFieldsChanged
            || Array.isArray(body.extraEngineerIds)
        ){

            const engineerIds = new Set<string>();

            if(previousEngineerId){
                engineerIds.add(previousEngineerId);
            }

            if(workorder.assignedUserId){
                engineerIds.add(workorder.assignedUserId);
            }

            for(const e of existingWorkorder.extraEngineers){
                engineerIds.add(e.userId);
            }

            for(const uid of nextExtraIds){
                engineerIds.add(uid);
            }

            const dates = new Set<number>();

            if(previousPlannedDate){
                dates.add(previousPlannedDate.getTime());
            }

            if(workorder.plannedDate){
                dates.add(workorder.plannedDate.getTime());
            }

            for(const engineerId of engineerIds){
                for(const ts of dates){
                    await syncEngineerDayKilometers(
                        engineerId,
                        new Date(ts)
                    );
                }
            }

        }




        if (
            isNasArchiveEnabled()
            && session.user.role !== "engineer"
            && migrateStatus(workorder.status) === "gefactureerd"
            && migrateStatus(existingWorkorder.status) !== "gefactureerd"
        ) {
            await prisma.workorder.update({
                where: { id },
                data: {
                    archiveStatus: "pending",
                    archiveError: null,
                },
            });

            after(async () => {
                try {
                    await archiveWorkorderToNas(id);
                } catch (error) {
                    console.error("NAS ARCHIVE ERROR", id, error);
                }
            });
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
                "Opdracht opslaan mislukt"

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


    // Alleen kantoor en admin mogen opdrachten verwijderen.
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
                error:"Opdracht verwijderen mislukt"
            },

            {
                status:500
            }

        );


    }


}
