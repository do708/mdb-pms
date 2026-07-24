import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";
import { requireApiUser } from "@/lib/auth/guard";



const supabase = createClient(

    process.env.NEXT_PUBLIC_SUPABASE_URL!,

    process.env.SUPABASE_SERVICE_ROLE_KEY!

);





export async function POST(

    request: NextRequest

) {


    try {

        const guard =
            await requireApiUser();

        if(!guard.ok){
            return guard.response;
        }



        const formData =
            await request.formData();



        const file =
            formData.get("file") as File;



        if(!file){


            return NextResponse.json(

                {

                    success:false,

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

            `${Date.now()}-${file.name}`;







        const { data, error } =

            await supabase.storage

                .from("workorder-files")

                .upload(

                    filename,

                    buffer,

                    {

                        contentType:
                            file.type,

                        upsert:false

                    }

                );







        if(error){


            console.error(
                error
            );


            return NextResponse.json(

                {

                    success:false,

                    error:error.message

                },

                {

                    status:500

                }

            );


        }








        const {

            data:urlData

        } = supabase.storage

            .from("workorder-files")

            .getPublicUrl(

                data.path

            );







        return NextResponse.json({

            success:true,

            url:urlData.publicUrl,

            filename:data.path

        });







    } catch(error){



        console.error(
            "UPLOAD ERROR:",
            error
        );



        return NextResponse.json(

            {

                success:false,

                error:"Upload mislukt"

            },

            {

                status:500

            }

        );


    }


}