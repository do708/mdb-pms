import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { customerName, workorderLocation, resolveCustomer } from "@/lib/workorderCustomer";

import { generateWorkorderHtmlPdf } from "@/lib/pdf/workorderHtmlPdf";


import { sendWorkorderMail } from "@/lib/email/sendWorkorderMail";
import { sendNietGereedMail } from "@/lib/email/sendNietGereedMail";
import { requireWorkorderAccess } from "@/lib/auth/guard";
import { buildWorkorderPhotosZip } from "@/lib/workorders/buildPhotosZip";
import { zonderInstructieFotos } from "@/lib/werkInstructie/parseWerkInstructie";

export const maxDuration = 60;

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

                    photos:{
                        orderBy:{
                            createdAt:"asc"
                        }
                    },

                    signature:true,

                    assignedUser:true,

                    extraEngineers:{
                        include:{
                            user:{
                                select:{
                                    name:true
                                }
                            }
                        }
                    }

                }


            });







        if(!workorder){


            return NextResponse.json(

                {

                    error:
                    "Opdracht niet gevonden"

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
                    new Date(),

                    // Uitvoerdatum vastleggen als die nog niet gezet is,
                    // zodat "Uitgevoerd op" in de PDF klopt.
                    workDate:
                    workorder.workDate ?? new Date()

                }

            });









        // PDF genereren mag het afronden NIET blokkeren.
        let pdfBuffer: Buffer | null = null;
        const appUrl = (
            process.env.NEXT_PUBLIC_APP_URL
            ?? "https://pms.mdb-networks.nl"
        ).replace(/\/$/, "");

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

                    extraEngineerNames:
                        (workorder.extraEngineers ?? [])
                        .map((extra)=>extra.user?.name)
                        .filter((name):name is string => Boolean(name && name.trim())),

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
                        zonderInstructieFotos(
                            workorder.photos ?? [],
                            workorder.werkInstructie
                        ).map(photo=>({
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
                appUrl);

            pdfBuffer = Buffer.from(pdf);

            // PDF-bytes in de database bewaren.
            await prisma.workorder.update({
                where:{ id },
                data:{
                    pdfData:Uint8Array.from(pdfBuffer),
                    pdfGeneratedAt:new Date()
                }
            });

        } catch(pdfError){

            console.error(
                "WERKBON PDF MISLUKT (afronden gaat door)",
                pdfError
            );

        }


        // Foto-ZIP voor kantoor: losse foto's met de naam die de monteur gaf.
        let zipBuffer: Buffer | null = null;
        try {
            zipBuffer = await buildWorkorderPhotosZip(
                zonderInstructieFotos(
                    workorder.photos ?? [],
                    workorder.werkInstructie
                ).map((photo)=>({
                    id: photo.id,
                    url: photo.url,
                    filename: photo.filename,
                    caption: photo.caption
                }))
            );
        } catch(zipError){
            console.error(
                "WERKBON FOTO-ZIP MISLUKT (afronden gaat door)",
                zipError
            );
        }


        // Altijd mailen naar projects@ na succesvolle afronding,
        // ook als de PDF of ZIP niet lukte. Mail mag afronden niet blokkeren.
        try {
            const locatie =
                workorderLocation(workorder)
                || [workorder.straat, workorder.huisnummer].filter(Boolean).join(" ")
                || [workorder.location, workorder.city].filter(Boolean).join(", ")
                || null;

            await sendWorkorderMail({
                workorderNumber:
                    workorder.number,
                customer:
                    customerName(workorder),
                project:
                    (workorder.project?.name ?? customerName(workorder)),
                location:
                    locatie,
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
                workorderUrl:
                    `${appUrl}/workorders/${workorder.id}`,
                pdfBuffer,
                zipBuffer
            });
        } catch(mailOnlyError){
            console.error("WERKBON MAIL MISLUKT (afronden gaat door)", mailOnlyError);
        }


        // Extra melding naar kantoor als de werkzaamheden NIET gereed zijn.
        try {

            const afronding =
                (workorder.formData as { afronding?: {
                    werkzaamhedenGereed?:string;
                    nietGereedOmschrijving?:string;
                } } | null)?.afronding;

            if(afronding?.werkzaamhedenGereed === "niet_gereed"){

                await sendNietGereedMail({
                    workorderNumber:
                        workorder.number,
                    opdrachtgever:
                        (workorder.project?.customer?.name
                         ?? customerName(workorder)),
                    klant:
                        customerName(workorder),
                    adres:
                        (workorderLocation(workorder)
                         || [workorder.location, workorder.city].filter(Boolean).join(", ")
                         || "—"),
                    werkzaamheden:
                        (workorder.description ?? workorder.title ?? "—"),
                    omschrijving:
                        (afronding.nietGereedOmschrijving || "(geen omschrijving ingevuld)"),
                    monteur:
                        (workorder.assignedUser?.name ?? "Een monteur")
                });

            }

        } catch(nietGereedError){
            console.error("NIET-GEREED MAIL MISLUKT (afronden gaat door)", nietGereedError);
        }









        // Melding voor kantoor/projects dat de werkbon is verstuurd.
        try {
            await prisma.notification.create({
                data:{
                    type:"workorder_sent",
                    title:`Opdracht ${workorder.number} verstuurd`,
                    message:`${customerName(workorder)} — opdracht is uitgevoerd en verstuurd door de monteur.`,
                    workorderId:workorder.id
                }
            });
        } catch(notifyError){
            console.error("MELDING AANMAKEN MISLUKT (afronden gaat door)", notifyError);
        }


        return NextResponse.json({

            success:true,

            message:
            "Opdracht afgerond en verzonden",


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
                "Opdracht afronden mislukt"

            },

            {

                status:500

            }

        );


    }


}