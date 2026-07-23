import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { generateWorkorderPdf } from "@/lib/pdf/workorderPdf";

import { createClient } from "@supabase/supabase-js";





const supabase = createClient(

    process.env.NEXT_PUBLIC_SUPABASE_URL!,

    process.env.SUPABASE_SERVICE_ROLE_KEY!

);







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





        const workorder =

            await prisma.workorder.findUnique({

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


                    materials:true


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

            await generateWorkorderPdf({

                number:
                    workorder.number,


                title:
                    workorder.title,


                description:
                    workorder.description,


                customer:
                    workorder.project.customer.name,


                address:
                    workorder.project.customer.address,


                project:
                    workorder.project.name,


                hours:

                    workorder.hours.reduce(

                        (total,item)=>

                            total + Number(item.hours),

                        0

                    ),



                materials:

                    workorder.materials.map(item=>({

                        name:
                            item.name,


                        quantity:
                            item.quantity

                    }))


            });







        const filename =

            `workorders/${workorder.number}.pdf`;







        const upload =

            await supabase.storage

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








        const url =

            supabase.storage

            .from("workorder-files")

            .getPublicUrl(

                filename

            )

            .data

            .publicUrl;








        const document =

            await prisma.document.create({

                data:{

    name:
        `${workorder.number}.pdf`,

    type:
        "pdf",

    url,

    workorderId:id

}

            });








        return NextResponse.json({

            success:true,

            document

        });







    } catch(error){


        console.error(

            "GENERATE PDF ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "PDF opslaan mislukt"

            },

            {

                status:500

            }

        );


    }


}