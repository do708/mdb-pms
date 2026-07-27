import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { customerName, workorderLocation, resolveCustomer } from "@/lib/workorderCustomer";

import { generateWorkorderHtmlPdf } from "@/lib/pdf/workorderHtmlPdf";


import { sendWorkorderMail } from "@/lib/email/sendWorkorderMail";
import { requireWorkorderAccess } from "@/lib/auth/guard";





export async function POST(

    request: NextRequest,

    context:{
        params:Promise<{
            id:string;
        }>
    }

){


    try {


        const { id } =
            await context.params;

        const guard =
            await requireWorkorderAccess(id);

        if(!guard.ok){
            return guard.response;
        }








        const workorder =

            await prisma.workorder.findUnique({

                where:{

                    id

                },


                include:{

                    customer:true,

                    project:{
                        include:{
                            customer:true
                        }
                    },

                    hours:true,

                    hardware:true,

                    photos:true,

                    signature:true,

                    assignedUser:true

                }


            });







        if(!workorder){


            return NextResponse.json(

                {

                    error:
                    "Werkbon niet gevonden"

                },

                {

                    status:404

                }

            );


        }








        const updated =

            await prisma.workorder.update({

                where:{

                    id

                },


                data:{

                    status:
                    "uitgevoerd",

                    sentAt:
                    new Date()

                }

            });









        // PDF genereren en mailen mag het afronden NIET blokkeren.
        // Lukt het versturen niet (bijv. geen mailconfiguratie lokaal),
        // dan wordt de werkbon toch gewoon afgerond.
        try {

            const pdf =

                await generateWorkorderHtmlPdf({

                    number:
                        workorder.number,

                    title:
                        workorder.title,

                    status:
                        "uitgevoerd",

                    description:
                        workorder.description,

                    plannedDate:
                        workorder.plannedDate,

                    workDate:
                        workorder.workDate,

                    createdAt:
                        workorder.createdAt,

                    projectName:
                        (workorder.project?.name ?? customerName(workorder)),

                    customer:{
                        name:
                            customerName(workorder),
                        address:
                            (resolveCustomer(workorder)?.address ?? null),
                        phone:
                            (resolveCustomer(workorder)?.phone ?? null),
                        email:
                            (resolveCustomer(workorder)?.email ?? null)
                    },

                    engineerName:
                        workorder.assignedUser?.name ?? null,

                    hours:
                        workorder.hours.map(item=>({
                            date:
                                item.date,
                            hours:
                                Number(item.hours ?? 0),
                            travelTime:
                                Number(item.travelTime ?? 0),
                            kilometers:
                                Number(item.kilometers ?? 0),
                            hotel:
                                item.hotel
                        })),

                    hardware:
                        (workorder.hardware ?? []).map(item=>({
                            name:
                                item.name,
                            brand:
                                item.brand,
                            model:
                                item.model,
                            serialNumber:
                                item.serialNumber,
                            quantity:
                                item.quantity,
                            location:
                                item.location,
                            status:
                                item.status
                        })),

                    photos:
                        (workorder.photos ?? []).map(photo=>({
                            url:
                                photo.url,
                            caption:
                                photo.caption ?? null
                        })),

                    signatureUrl:
                        workorder.signature?.signatureUrl ?? null,

                    signedBy:
                        workorder.signature?.customerName ?? null,

                    formData:
                        workorder.formData,

                    customerSchema:
                        workorder.customer?.formSchema ?? null

                },
                (
                    process.env.NEXT_PUBLIC_APP_URL
                    ?? "http://localhost:3000"
                ));




            // PDF-bytes in de database bewaren.
            await prisma.workorder.update({
                where:{ id },
                data:{
                    pdfData:Buffer.from(pdf),
                    pdfGeneratedAt:new Date()
                }
            });


            // Mailen mag falen zonder het afronden te blokkeren.
            try {
                await sendWorkorderMail({
                    workorderNumber:
                        workorder.number,
                    customer:
                        customerName(workorder),
                    project:
                        (workorder.project?.name ?? customerName(workorder)),
                    monteur:
                        (workorder.assignedUser?.name ?? "Een monteur"),
                    datum:
                        (()=>{
                            const d =
                                workorder.workDate
                                ?? workorder.plannedDate
                                ?? new Date();
                            return new Date(d).toLocaleDateString("nl-NL",{
                                day:"numeric",
                                month:"long",
                                year:"numeric"
                            });
                        })(),
                    pdfBuffer:
                        Buffer.from(pdf)
                });
            } catch(mailOnlyError){
                console.error("WERKBON MAIL MISLUKT (afronden gaat door)", mailOnlyError);
            }


        } catch(mailError){

            console.error(
                "WERKBON PDF/MAIL MISLUKT (afronden gaat door)",
                mailError
            );

        }









        // Melding voor kantoor/projects dat de werkbon is verstuurd.
        try {
            await prisma.notification.create({
                data:{
                    type:"workorder_sent",
                    title:`Werkbon ${workorder.number} verstuurd`,
                    message:`${customerName(workorder)} — werkbon is uitgevoerd en verstuurd door de monteur.`,
                    workorderId:workorder.id
                }
            });
        } catch(notifyError){
            console.error("MELDING AANMAKEN MISLUKT (afronden gaat door)", notifyError);
        }


        return NextResponse.json({

            success:true,

            message:
            "Werkbon afgerond en verzonden",


            workorder:updated

        });







    } catch(error){


        console.error(

            "COMPLETE WORKORDER ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Werkbon afronden mislukt"

            },

            {

                status:500

            }

        );


    }


}