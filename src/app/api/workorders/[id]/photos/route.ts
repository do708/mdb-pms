import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";



export async function POST(

    request: NextRequest,

    context: {
        params: Promise<{
            id:string;
        }>
    }

) {


    try {


        const { id } = await context.params;


        const body = await request.json();



        const {

            url,

            filename,

        } = body;





        if(!url){


            return NextResponse.json(

                {

                    success:false,

                    error:"Foto URL ontbreekt"

                },

                {

                    status:400

                }

            );


        }






        const workorder = await prisma.workorder.findUnique({

            where:{
                id
            }

        });





        if(!workorder){


            return NextResponse.json(

                {

                    success:false,

                    error:"Werkbon niet gevonden"

                },

                {

                    status:404

                }

            );


        }







        const photo = await prisma.workorderPhoto.create({

            data:{


                workorderId:id,


                url,


                filename:
                    filename ?? null,


            }

        });







        return NextResponse.json({

            success:true,

            photo,

        });







    } catch(error){



        console.error(
            "PHOTO UPLOAD ERROR:",
            error
        );



        return NextResponse.json(

            {

                success:false,

                error:"Foto opslaan mislukt"

            },

            {

                status:500

            }

        );


    }


}