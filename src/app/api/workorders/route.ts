import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";

import { mergeOpleverData } from "@/types/oplever";
import {
    assignedToEngineer,
    excludeArchivedWorkorders,
} from "@/lib/archive";
import { ENGINEER_OPDRACHT_STATUS_KEYS } from "@/constants/workorderStatus";

import { syncEngineerDayKilometers } from "@/lib/travel/syncEngineerDayKilometers";
import { parsePlanningDateInput } from "@/lib/datetime/amsterdam";
import { ontbrekendeVerplichteLocatieVelden } from "@/lib/workorders/address";
import { ensureWorkorderOpdrachtnummerKolom } from "@/lib/prismaEnsure";
import { parseOpleverModules } from "@/lib/workorders/opleverModules";
import { syncWorkorderForms } from "@/lib/workorders/syncForms";





function generateWorkorderNumber(){


    const year =
        new Date().getFullYear();



    const random =
        Math.floor(
            Math.random() * 9000
        ) + 1000;



    return `WB-${year}-${random}`;

}








export async function GET(){


    try {

        await ensureWorkorderOpdrachtnummerKolom();


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





        const role =
            session.user.role;





        const where =

            role === "engineer"

            ?

            {

                AND: [
                    assignedToEngineer(session.user.id),
                    {
                        status: {
                            in: [...ENGINEER_OPDRACHT_STATUS_KEYS],
                        },
                    },
                ],

            }

            :

            {

                ...excludeArchivedWorkorders()

            };








        // Lijst: geen oplever-JSON of PDF-bytes (detail via /[id]).
        const workorders =

            await prisma.workorder.findMany({


                where,

                omit: {
                    formData: true,
                    aanvraagSpecificaties: true,
                    pdfData: true,
                },

                include:{


                    project:{

                        include:{

                            customer:true

                        }

                    },

                    customer:true,


                    assignedUser:true,

                    _count:{
                        select:{
                            photos:true
                        }
                    }


                },



                orderBy:{


                    createdAt:"desc"


                }


            });







        return NextResponse.json(

            workorders

        );





    } catch(error){


        console.error(

            "GET WORKORDERS ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Opdrachten ophalen mislukt"

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





        const body =
            await request.json();





        await ensureWorkorderOpdrachtnummerKolom();

        // Opdrachtgever, filiaalnaam en contactpersoon zijn verplicht; adres is optioneel

        const locatieFout = ontbrekendeVerplichteLocatieVelden({
            customerId: body.customerId,
            title: body.title,
            straat: body.straat,
            huisnummer: body.huisnummer,
            city: body.city,
            contactPersoon: body.contactPersoon,
        });

        if(locatieFout){
            return NextResponse.json(
                { error: locatieFout },
                { status: 400 }
            );
        }

        if(body.customerId){

            const customer =
                await prisma.customer.findUnique({
                    where:{
                        id:body.customerId
                    }
                });

            if(!customer){

                return NextResponse.json(
                    {
                        error:"Gekozen opdrachtgever bestaat niet"
                    },
                    {
                        status:400
                    }
                );

            }

        }







        let assignedUserId =
            body.assignedUserId || null;





        // Monteur mag alleen zichzelf gebruiken

        if(session.user.role === "engineer"){


            assignedUserId =
                session.user.id;


        }








        const plannedDateValue =
            parsePlanningDateInput(body.plannedDate);


        const createData = {


                    number:
                        generateWorkorderNumber(),



                    title:
                        body.title,



                    description:
                        body.description || null,

                    werkInstructie:
                        body.werkInstructie || null,



                    internalNotes:
                        body.internalNotes || null,



                    formData:
                        body.formData
                        ?
                        mergeOpleverData(
                            body.formData
                        ) as object
                        :
                        undefined,

                    opleverModules:
                        body.opleverModules !== undefined
                        ?
                        parseOpleverModules(body.opleverModules)
                        :
                        [],



                    projectId:
                        body.projectId || null,



                    customerId:
                        body.customerId || null,



                    location:
                        body.location
                        ||
                        [body.straat, body.huisnummer]
                            .filter(Boolean)
                            .join(" ")
                            .trim()
                        ||
                        null,

                    straat:
                        body.straat || null,

                    huisnummer:
                        body.huisnummer || null,

                    postcode:
                        body.postcode || null,

                    city:
                        body.city || null,

                    contactPersoon:
                        body.contactPersoon || null,

                    contactEmail:
                        body.contactEmail || null,

                    contactPhone:
                        body.contactPhone || null,



                    assignedUserId,



                    plannedDate:

                        plannedDateValue,



                    plannedEndDate:

                        parsePlanningDateInput(body.plannedEndDate),



                    plannedHours:

                        body.plannedHours === null ||
                        body.plannedHours === undefined ||
                        body.plannedHours === ""

                        ?

                        null

                        :

                        Number(body.plannedHours),



                    status:
                        body.status || "ontvangen"


        };

        const workorder =
            await prisma.workorder.create({
                data: createData,
            });

        const opdrachtnummerKlant =
            typeof body.opdrachtnummerOpdrachtgever === "string"
            ? body.opdrachtnummerOpdrachtgever.trim()
            : "";

        if (opdrachtnummerKlant) {
            try {
                await prisma.workorder.update({
                    where: { id: workorder.id },
                    data: { opdrachtnummerOpdrachtgever: opdrachtnummerKlant },
                });
                workorder.opdrachtnummerOpdrachtgever = opdrachtnummerKlant;
            } catch (nummerError) {
                console.error(
                    "CREATE WORKORDER OPDRACHTNUMMER ERROR",
                    nummerError
                );
            }
        }




        // Extra monteurs koppelen (naast de hoofdmonteur)
        if(Array.isArray(body.extraEngineerIds)){

            const unique =
                [...new Set(
                    body.extraEngineerIds.filter(
                        (uid:string)=>uid && uid !== assignedUserId
                    )
                )] as string[];

            for(const uid of unique){

                await prisma.workorderEngineer.create({
                    data:{
                        workorderId:workorder.id,
                        userId:uid
                    }
                }).catch(()=>{
                    // dubbele koppeling negeren
                });

            }

        }




        // Aangevinkte opleverformulieren aan de werkbon koppelen.
        await syncWorkorderForms(workorder.id, body.formTypeIds);









        try {
            await syncEngineerDayKilometers(
                workorder.assignedUserId,
                workorder.plannedDate
            );
        } catch (travelError) {
            console.error("CREATE WORKORDER TRAVEL ERROR", travelError);
        }


        return NextResponse.json(

            workorder,

            {

                status:201

            }

        );





    } catch(error){


        console.error(

            "CREATE WORKORDER ERROR",

            error

        );



        const prismaCode =
            error && typeof error === "object" && "code" in error
            ? String((error as { code: unknown }).code)
            : "";

        return NextResponse.json(

            {

                error:
                    prismaCode
                    ? `Opdracht aanmaken mislukt (${prismaCode})`
                    : "Opdracht aanmaken mislukt"

            },

            {

                status:500

            }

        );


    }


}