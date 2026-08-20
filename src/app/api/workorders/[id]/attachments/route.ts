import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { requireWorkorderAccess } from "@/lib/auth/guard";
import { removeAttachmentObject } from "@/lib/attachments/storage";



const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);



// Lijst met correspondentie/bijlagen van een werkbon.
export async function GET(
    request: NextRequest,
    context:{
        params:Promise<{ id:string }>
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


        const attachments =
            await prisma.workorderAttachment.findMany({
                where:{
                    workorderId:id
                },
                orderBy:{
                    createdAt:"desc"
                }
            });


        return NextResponse.json(attachments);

    } catch(error){

        console.error("ATTACHMENTS GET ERROR:", error);

        return NextResponse.json(
            { error:"Bijlagen ophalen mislukt" },
            { status:500 }
        );

    }

}



// Een bijlage toevoegen (upload). Slaat op in de opslag en bewaart een
// verwijzing in de database. De opslaglaag (nu Supabase) is zo te vervangen
// door bijvoorbeeld een NAS, zonder dat de werkbon-pagina verandert.
export async function POST(
    request: NextRequest,
    context:{
        params:Promise<{ id:string }>
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


        const formData =
            await request.formData();

        const file =
            formData.get("file") as File;

        if(!file){
            return NextResponse.json(
                { error:"Geen bestand ontvangen" },
                { status:400 }
            );
        }


        const bytes =
            await file.arrayBuffer();

        const buffer =
            Buffer.from(bytes);


        const veiligeNaam =
            file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

        const opslagNaam =
            `correspondentie/${id}/${Date.now()}-${veiligeNaam}`;


        const { data, error } =
            await supabase.storage
                .from("workorder-files")
                .upload(
                    opslagNaam,
                    buffer,
                    {
                        contentType:
                            file.type || "application/octet-stream",
                        upsert:false
                    }
                );

        if(error){
            console.error(error);
            return NextResponse.json(
                { error:error.message },
                { status:500 }
            );
        }


        const { data:urlData } =
            supabase.storage
                .from("workorder-files")
                .getPublicUrl(data.path);


        const attachment =
            await prisma.workorderAttachment.create({
                data:{
                    workorderId:id,
                    url:urlData.publicUrl,
                    filename:data.path,
                    originalName:file.name,
                    contentType:file.type || null
                }
            });


        return NextResponse.json(attachment);

    } catch(error){

        console.error("ATTACHMENTS POST ERROR:", error);

        return NextResponse.json(
            { error:"Bijlage opslaan mislukt" },
            { status:500 }
        );

    }

}



// Een bijlage verwijderen (op id, meegegeven als ?attachmentId=...).
export async function DELETE(
    request: NextRequest,
    context:{
        params:Promise<{ id:string }>
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


        const { searchParams } =
            new URL(request.url);

        const attachmentId =
            searchParams.get("attachmentId");

        if(!attachmentId){
            return NextResponse.json(
                { error:"Geen bijlage opgegeven" },
                { status:400 }
            );
        }


        const attachment =
            await prisma.workorderAttachment.findUnique({
                where:{ id:attachmentId }
            });

        if(!attachment || attachment.workorderId !== id){
            return NextResponse.json(
                { error:"Bijlage niet gevonden" },
                { status:404 }
            );
        }


        // Uit de opslag verwijderen (best effort, meerdere padvarianten).
        await removeAttachmentObject({
            ...attachment,
            workorderId: id,
        }).catch(()=>{});

        await prisma.workorderAttachment.delete({
            where:{ id:attachmentId }
        });


        return NextResponse.json({ ok:true });

    } catch(error){

        console.error("ATTACHMENTS DELETE ERROR:", error);

        return NextResponse.json(
            { error:"Bijlage verwijderen mislukt" },
            { status:500 }
        );

    }

}
