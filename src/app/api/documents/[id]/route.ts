import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole, requireApiUser } from "@/lib/auth/guard";

import { createClient } from "@supabase/supabase-js";
import { contentTypeForFilename } from "@/lib/attachments/contentType";
import {
    deleteDocumentenboxFromNas,
    downloadDocumentenboxFromNas,
    supabaseStoragePathFromUrl,
} from "@/lib/documents/documentenboxStorage";
import { nasPathFromStored } from "@/lib/nas/synologyConfig";



const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    _request: Request,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    const guard = await requireApiUser();

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;
        const document = await prisma.document.findUnique({
            where: { id },
        });

        if (!document) {
            return NextResponse.json(
                { error: "Document niet gevonden" },
                { status: 404 }
            );
        }

        let buffer: Buffer;

        if (nasPathFromStored(document.url)) {
            buffer = await downloadDocumentenboxFromNas(document.url);
        } else {
            const path = supabaseStoragePathFromUrl(document.url);

            if (!path) {
                return NextResponse.json(
                    { error: "Bestand niet gevonden in opslag" },
                    { status: 404 }
                );
            }

            const download = await supabase.storage
                .from("workorder-files")
                .download(path);

            if (download.error || !download.data) {
                return NextResponse.json(
                    { error: "Bestand niet gevonden in opslag" },
                    { status: 404 }
                );
            }

            buffer = Buffer.from(await download.data.arrayBuffer());
        }

        const filename = document.name.replace(/"/g, "");

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": contentTypeForFilename(document.name),
                "Content-Disposition": `inline; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("DOCUMENT GET ERROR", error);

        return NextResponse.json(
            { error: "Document ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request:Request,
    context:{
        params:Promise<{
            id:string;
        }>
    }
){


    const guard =
        await requireApiRole(["admin","office"]);


    if(!guard.ok){

        return guard.response;

    }


    try {


        const { id } =
            await context.params;


        const document =
            await prisma.document.findUnique({
                where:{
                    id
                }
            });


        if(!document){

            return NextResponse.json(

                {
                    error:"Document niet gevonden"
                },

                {
                    status:404
                }

            );

        }




        // Bijbehorend bestand uit de opslag halen (best effort)
        try {

            if (nasPathFromStored(document.url)) {
                await deleteDocumentenboxFromNas(document.url);
            } else {
                const path = supabaseStoragePathFromUrl(document.url);

                if (path) {
                    await supabase.storage
                        .from("workorder-files")
                        .remove([path]);
                }
            }

        } catch(storageError){

            console.error(
                "DOCUMENT STORAGE DELETE ERROR",
                storageError
            );

        }




        await prisma.document.delete({
            where:{
                id
            }
        });


        return NextResponse.json({
            success:true,
            deleted:true
        });


    } catch(error){


        console.error(
            "DOCUMENT DELETE ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Document verwijderen mislukt"
            },

            {
                status:500
            }

        );


    }


}
