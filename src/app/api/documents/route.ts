import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser, requireApiRole } from "@/lib/auth/guard";
import { createClient } from "@supabase/supabase-js";
import { contentTypeForFilename } from "@/lib/attachments/contentType";
import {
    supabaseStoragePathFromUrl,
    uploadDocumentenboxToNas,
} from "@/lib/documents/documentenboxStorage";
import { isNasConfigured } from "@/lib/nas/synologyConfig";



const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateDocumentenboxToNas(document: {
    id: string;
    name: string;
    type: string;
    url: string;
    workorderId: string | null;
    createdAt: Date;
}) {
    if (!isNasConfigured()) {
        return document;
    }

    if (document.url.startsWith("nas:")) {
        return document;
    }

    const path = supabaseStoragePathFromUrl(document.url);

    if (!path) {
        return document;
    }

    const download = await supabase.storage
        .from("workorder-files")
        .download(path);

    if (download.error || !download.data) {
        return document;
    }

    const buffer = Buffer.from(await download.data.arrayBuffer());
    const nasUrl = await uploadDocumentenboxToNas(
        document.name,
        buffer,
        contentTypeForFilename(document.name)
    );

    const updated = await prisma.document.update({
        where: { id: document.id },
        data: { url: nasUrl },
    });

    await supabase.storage.from("workorder-files").remove([path]).catch(() => {});

    return updated;
}

export async function GET() {


    try {

        const guard =
            await requireApiUser();

        if(!guard.ok){
            return guard.response;
        }



        const documents = await prisma.document.findMany({

            where:{
                workorderId: null
            },

            orderBy:{

                createdAt:"desc"

            }

        });

        const migrated = [];

        for (const document of documents) {
            const next = await migrateDocumentenboxToNas(document).catch(
                (error) => {
                    console.error(
                        "DOCUMENT NAS MIGRATE ERROR",
                        document.id,
                        error
                    );
                    return document;
                }
            );

            migrated.push({
                ...next,
                url: `/api/documents/${next.id}`,
            });
        }

        return NextResponse.json(migrated);



    } catch(error){


        console.error(error);


        return NextResponse.json(

            {

                error:"Documenten ophalen mislukt"

            },

            {

                status:500

            }

        );


    }


}



// Los document uploaden (niet aan een werkbon gekoppeld) via de
// documentenbox. Kantoor/admin sleept hier belangrijke bestanden naartoe.

export async function POST(
    request:NextRequest
){


    const guard =
        await requireApiRole(["admin","office"]);


    if(!guard.ok){

        return guard.response;

    }


    try {


        const form =
            await request.formData();


        const file =
            form.get("file") as File | null;


        const workorderId =
            (form.get("workorderId") as string | null) || null;


        if(!file){

            return NextResponse.json(
                {
                    error:"Geen bestand ontvangen"
                },
                {
                    status:400
                }
            );

        }




        const bytes =
            await file.arrayBuffer();


        const buffer =
            Buffer.from(bytes);


        const contentType =
            file.type || contentTypeForFilename(file.name);

        let url: string;

        if (!workorderId) {
            if (!isNasConfigured()) {
                return NextResponse.json(
                    {
                        error:
                            "NAS is niet ingesteld. Documenten horen op de NAS, niet in Supabase.",
                    },
                    { status: 503 }
                );
            }

            url = await uploadDocumentenboxToNas(
                file.name,
                buffer,
                contentType
            );
        } else {
            const filename = `documenten/${Date.now()}-${file.name}`;
            const upload = await supabase.storage
                .from("workorder-files")
                .upload(filename, buffer, {
                    contentType,
                    upsert: false,
                });

            if (upload.error) {
                throw upload.error;
            }

            url = supabase.storage
                .from("workorder-files")
                .getPublicUrl(filename).data.publicUrl;
        }




        // Bestandstype uit de extensie
        const extension =
            file.name.includes(".")
            ?
            file.name.split(".").pop()!.toLowerCase()
            :
            "bestand";


        const document =
            await prisma.document.create({

                data:{

                    name:
                        file.name,

                    type:
                        extension,

                    url,

                    workorderId

                }

            });




        return NextResponse.json(
            document,
            {
                status:201
            }
        );


    } catch(error){


        console.error(
            "DOCUMENT UPLOAD ERROR",
            error
        );


        return NextResponse.json(
            {
                error:"Document uploaden mislukt"
            },
            {
                status:500
            }
        );


    }


}
