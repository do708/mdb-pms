import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { customerName, workorderLocation, resolveCustomer } from "@/lib/workorderCustomer";

import { generateWorkorderPdf } from "@/lib/pdf/workorderPdf";

import { mergeOpleverData } from "@/types/oplever";

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
                    "uitgevoerd"

                }

            });









        // PDF genereren en mailen mag het afronden NIET blokkeren.
        // Lukt het versturen niet (bijv. geen mailconfiguratie lokaal),
        // dan wordt de werkbon toch gewoon afgerond.
        try {

            const pdf =

                await generateWorkorderPdf({

                    number:
                        workorder.number,


                    title:
                        workorder.title,


                    description:
                        workorder.description,


                    customer:
                        customerName(workorder),


                    address:
                        (resolveCustomer(workorder)?.address ?? null),


                    project:
                        (workorder.project?.name ?? customerName(workorder)),


                    hours:

                        (()=>{
                            const o = mergeOpleverData(workorder.formData);
                            const n = (v:unknown)=>{
                                const x = parseFloat(String(v ?? "").replace(",", "."));
                                return isNaN(x) ? 0 : x;
                            };
                            return (
                                n(o.tarief.urenMonteur1) +
                                n(o.tarief.urenMonteur2) +
                                n(o.tarief.urenMonteur3) +
                                n(o.tarief.urenMonteur4)
                            );
                        })()


                });




            await sendWorkorderMail({

                workorderNumber:
                    workorder.number,


                customer:
                    customerName(workorder),


                project:
                    (workorder.project?.name ?? customerName(workorder)),


                pdfBuffer:
                    Buffer.from(pdf)

            });


        } catch(mailError){

            console.error(
                "WERKBON PDF/MAIL MISLUKT (afronden gaat door)",
                mailError
            );

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