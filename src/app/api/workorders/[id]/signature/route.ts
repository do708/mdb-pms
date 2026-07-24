import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { createClient } from "@supabase/supabase-js";
import { requireWorkorderAccess } from "@/lib/auth/guard";





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

        const guard =
            await requireWorkorderAccess(id);

        if(!guard.ok){
            return guard.response;
        }






        const body =
            await request.json();





        const workorder =
            await prisma.workorder.findUnique({

                where:{

                    id

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







        const image =
            body.image;





        if(!image){


            return NextResponse.json(

                {

                    error:
                    "Geen handtekening ontvangen"

                },

                {

                    status:400

                }

            );


        }








        const base64Data =
            image.replace(

                /^data:image\/png;base64,/,

                ""

            );





        const buffer =
            Buffer.from(

                base64Data,

                "base64"

            );







        const filename =

            `${id}/signature-${Date.now()}.png`;








        const upload =
            await supabase.storage

            .from("workorder-files")

            .upload(

                filename,

                buffer,

                {

                    contentType:
                    "image/png",

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









        const signature =

            await prisma.workorderSignature.upsert({

                where:{

                    workorderId:id

                },


                update:{

                    signatureUrl:url

                },


                create:{

                    workorderId:id,

                    signatureUrl:url

                }

            });








        return NextResponse.json({

            success:true,

            signature

        });






    } catch(error){


        console.error(

            "SIGNATURE ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Handtekening opslaan mislukt"

            },

            {

                status:500

            }

        );


    }


}