import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

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







        const formData =
            await request.formData();





        const files =
            formData.getAll(
                "photos"
            ) as File[];






        if(files.length === 0){


            return NextResponse.json(

                {
                    error:
                    "Geen foto's ontvangen"
                },

                {
                    status:400
                }

            );

        }








        const uploadedPhotos = [];






        for(const file of files){



            const buffer =
                Buffer.from(
                    await file.arrayBuffer()
                );



            const filename =

                `${id}/${Date.now()}-${file.name}`;





            const upload =
                await supabase.storage

                .from("workorder-files")

                .upload(

                    filename,

                    buffer,

                    {

                        contentType:
                        file.type,

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






            const photo =

                await prisma.workorderPhoto.create({

                    data:{

                        workorderId:id,

                        url

                    }

                });





            uploadedPhotos.push(photo);



        }








        return NextResponse.json({

            success:true,

            photos:uploadedPhotos

        });






    } catch(error){


        console.error(

            "PHOTO UPLOAD ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Foto upload mislukt"

            },

            {

                status:500

            }

        );


    }


}