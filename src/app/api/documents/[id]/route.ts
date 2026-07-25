import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";

import { createClient } from "@supabase/supabase-js";



const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);



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

            const marker = "/workorder-files/";

            const index =
                document.url.indexOf(marker);


            if(index !== -1){

                const path =
                    document.url.slice(
                        index + marker.length
                    );

                await supabase.storage
                    .from("workorder-files")
                    .remove([path]);

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
