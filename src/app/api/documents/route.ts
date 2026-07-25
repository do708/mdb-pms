import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser, requireApiRole } from "@/lib/auth/guard";
import { createClient } from "@supabase/supabase-js";



const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);



export async function GET() {


    try {

        const guard =
            await requireApiUser();

        if(!guard.ok){
            return guard.response;
        }



        const documents = await prisma.document.findMany({

            orderBy:{

                createdAt:"desc"

            },


            include:{

                workorder:{

                    include:{

                        project:{

                            include:{

                                customer:true

                            }

                        }

                    }

                }

            }

        });



        return NextResponse.json(

            documents

        );



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


        const filename =
            `documenten/${Date.now()}-${file.name}`;


        const upload =
            await supabase.storage
            .from("workorder-files")
            .upload(
                filename,
                buffer,
                {
                    contentType:
                        file.type || "application/octet-stream",
                    upsert:false
                }
            );


        if(upload.error){

            throw upload.error;

        }


        const url =
            supabase.storage
            .from("workorder-files")
            .getPublicUrl(filename)
            .data
            .publicUrl;




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
