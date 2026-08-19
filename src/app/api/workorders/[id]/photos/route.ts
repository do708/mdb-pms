import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { createClient } from "@supabase/supabase-js";
import { requireWorkorderAccess } from "@/lib/auth/guard";
import {
    compressPhoto,
    photoStorageName,
} from "@/lib/images/compressPhoto";

export const maxDuration = 60;

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
                    "Opdracht niet gevonden"
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



            const rawBuffer =
                Buffer.from(
                    await file.arrayBuffer()
                );

            const compressed = await compressPhoto(
                rawBuffer,
                file.type || "image/jpeg"
            );

            const filename =

                `${id}/${Date.now()}-${photoStorageName(file.name, compressed.extension)}`;





            const upload =
                await supabase.storage

                .from("workorder-files")

                .upload(

                    filename,

                    compressed.buffer,

                    {

                        contentType:
                            compressed.contentType,

                        upsert:true

                    }

                );





            if(upload.error){

                throw new Error(
                    upload.error.message
                    || "Opslag van de foto is mislukt"
                );

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

                        url,

                        filename:
                            file.name || null

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
                    error instanceof Error
                    ? error.message
                    : "Foto upload mislukt"

            },

            {

                status:500

            }

        );


    }


}


export async function GET(

    _request:NextRequest,

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

        const photos =
            await prisma.workorderPhoto.findMany({
                where:{
                    workorderId:id
                },
                orderBy:{
                    createdAt:"asc"
                }
            });

        return NextResponse.json({
            photos
        });

    } catch(error){

        console.error("PHOTO LIST ERROR", error);

        return NextResponse.json(
            { error:"Foto's ophalen mislukt" },
            { status:500 }
        );

    }

}


export async function PATCH(

    request:NextRequest,

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
            await request.json() as {
                photoId?:string;
                caption?:string;
            };

        if(!body.photoId){
            return NextResponse.json(
                { error:"photoId ontbreekt" },
                { status:400 }
            );
        }

        const photo =
            await prisma.workorderPhoto.findFirst({
                where:{
                    id: body.photoId,
                    workorderId: id
                }
            });

        if(!photo){
            return NextResponse.json(
                { error:"Foto niet gevonden" },
                { status:404 }
            );
        }

        const updated =
            await prisma.workorderPhoto.update({
                where:{
                    id: photo.id
                },
                data:{
                    caption:
                        typeof body.caption === "string"
                        ? body.caption
                        : photo.caption
                }
            });

        return NextResponse.json({
            photo: updated
        });

    } catch(error){

        console.error("PHOTO PATCH ERROR", error);

        return NextResponse.json(
            { error:"Foto bijwerken mislukt" },
            { status:500 }
        );

    }

}