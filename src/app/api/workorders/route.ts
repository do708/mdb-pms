import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";

import { mergeOpleverData } from "@/types/oplever";
import { excludeArchivedWorkorders } from "@/lib/archive";

import { syncEngineerDayKilometers } from "@/lib/travel/syncEngineerDayKilometers";
import { parsePlanningDateInput } from "@/lib/datetime/amsterdam";





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

                assignedUserId:
                    session.user.id,

                ...excludeArchivedWorkorders()

            }

            :

            {

                ...excludeArchivedWorkorders()

            };








        const workorders =

            await prisma.workorder.findMany({


                where,



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





        // Klant is optioneel maar aanbevolen; controleren als hij is meegegeven
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


        const workorder =

            await prisma.workorder.create({

                data:{


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


                }


            });




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
        if(Array.isArray(body.formTypeIds)){

            const uniekeFormTypes =
                [...new Set(
                    body.formTypeIds.filter((x:string)=>x)
                )] as string[];

            for(const formTypeId of uniekeFormTypes){

                await prisma.workorderForm.create({
                    data:{
                        workorderId:workorder.id,
                        formTypeId
                    }
                }).catch(()=>{
                    // ongeldige of dubbele koppeling negeren
                });

            }

        }









        await syncEngineerDayKilometers(
            workorder.assignedUserId,
            workorder.plannedDate
        );


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



        return NextResponse.json(

            {

                error:
                "Opdracht aanmaken mislukt"

            },

            {

                status:500

            }

        );


    }


}