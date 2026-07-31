import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";



const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);



// Publiek: upload van een bijlage bij het aanvraagformulier. Alleen toegestaan
// met een geldige klant-token, en alleen foto's en PDF's.
export async function POST(
    request: NextRequest
){

    try {

        const formData =
            await request.formData();


        const token =
            formData.get("token") as string;


        if(!token){
            return NextResponse.json(
                { success:false, error:"Geen token" },
                { status:400 }
            );
        }


        const customer =
            await prisma.customer.findUnique({
                where:{ publicToken:token },
                select:{ id:true }
            });


        if(!customer){
            return NextResponse.json(
                { success:false, error:"Onbekende link" },
                { status:404 }
            );
        }


        const file =
            formData.get("file") as File;


        if(!file){
            return NextResponse.json(
                { success:false, error:"Geen bestand ontvangen" },
                { status:400 }
            );
        }


        // Alleen afbeeldingen en PDF's toestaan.
        const toegestaan =
            file.type.startsWith("image/")
            || file.type === "application/pdf";

        if(!toegestaan){
            return NextResponse.json(
                { success:false, error:"Alleen foto's en PDF-bestanden zijn toegestaan" },
                { status:400 }
            );
        }


        const bytes =
            await file.arrayBuffer();

        const buffer =
            Buffer.from(bytes);


        const filename =
            `aanvragen/${Date.now()}-${file.name}`;


        const { data, error } =
            await supabase.storage
                .from("workorder-files")
                .upload(
                    filename,
                    buffer,
                    {
                        contentType:file.type,
                        upsert:false
                    }
                );


        if(error){
            console.error("AANVRAAG UPLOAD ERROR", error);
            return NextResponse.json(
                { success:false, error:error.message },
                { status:500 }
            );
        }


        const { data:urlData } =
            supabase.storage
                .from("workorder-files")
                .getPublicUrl(data.path);


        return NextResponse.json({
            success:true,
            url:urlData.publicUrl,
            name:file.name
        });

    } catch(error){

        console.error("AANVRAAG UPLOAD ERROR", error);

        return NextResponse.json(
            { success:false, error:"Upload mislukt" },
            { status:500 }
        );

    }

}
