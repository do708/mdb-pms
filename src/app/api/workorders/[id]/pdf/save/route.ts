import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { generateWorkorderPdf } from "@/lib/pdf/workorder";

import { createClient } from "@supabase/supabase-js";

import { sendWorkorderMail } from "@/lib/mail/sendWorkorderMail";
import { requireWorkorderAccess } from "@/lib/auth/guard";





const supabase = createClient(

    process.env.NEXT_PUBLIC_SUPABASE_URL!,

    process.env.SUPABASE_SERVICE_ROLE_KEY!

);







export async function POST(

    request: NextRequest,

    context: {
        params: Promise<{
            id:string;
        }>
    }

) {


    try {


        const { id } = await context.params;

        const guard =
            await requireWorkorderAccess(id);

        if(!guard.ok){
            return guard.response;
        }






        const workorder = await prisma.workorder.findUnique({

            where:{
                id
            },


            include:{


                project:{

                    include:{

                        customer:true

                    }

                },


                hours:true,


                materials:true,


                hardware:true,


                photos:true,


                signature:true


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







        const pdf = await generateWorkorderPdf(

            workorder

        );







        const filename =

            `werkbon-${workorder.number}.pdf`;







        const upload = await supabase.storage

            .from("workorder-files")

            .upload(

                filename,

                Buffer.from(pdf),

                {

                    contentType:
                    "application/pdf",

                    upsert:true

                }

            );







        if(upload.error){


            throw upload.error;

        }







        const url = supabase.storage

            .from("workorder-files")

            .getPublicUrl(

                filename

            )

            .data

            .publicUrl;








        const document = await prisma.document.create({

            data:{

                name:filename,

                type:"WORKORDER_PDF",

                url,

                workorderId:id

            }

        });








        await sendWorkorderMail({

            pdf:Buffer.from(pdf),

            filename,

            workorderNumber:
                workorder.number,

            customer:
                workorder.project.customer.name,

            project:
                workorder.project.name

        });








        return NextResponse.json({

            success:true,

            document

        });







    } catch(error){


        console.error(

            "PDF SAVE ERROR",

            error

        );



        return NextResponse.json(

            {

                error:"Werkbon verzenden mislukt"

            },

            {

                status:500

            }

        );


    }


}