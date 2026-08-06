import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { customerName, resolveCustomer } from "@/lib/workorderCustomer";

import { generateWorkorderHtmlPdf } from "@/lib/pdf/workorderHtmlPdf";
import { requireWorkorderAccess } from "@/lib/auth/guard";

export const maxDuration = 60;

export async function GET(

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

                    assignedUser:true,


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









        const pdf =

            await generateWorkorderHtmlPdf({

                number:
                    workorder.number,

                title:
                    workorder.title,

                status:
                    workorder.status,

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






const pdfBuffer =
    Buffer.from(pdf);



return new NextResponse(

    pdfBuffer,

    {

        headers:{

            "Content-Type":
            "application/pdf",

            "Content-Disposition":
            `attachment; filename=${workorder.number}.pdf`

        }

    }

);







    } catch(error){


        console.error(

            "PDF GENERATE ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "PDF maken mislukt"

            },

            {

                status:500

            }

        );


    }


}