import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { generateWorkorderPdf } from "@/lib/pdf/workorder";



export async function GET(

    request: NextRequest,

    context: {
        params: Promise<{
            id:string;
        }>
    }

) {


    try {


        const { id } = await context.params;




        const workorder = await prisma.workorder.findUnique({

            where:{
                id
            },


            include:{


                project:{

                    include:{

                        customer:true

                    }

                },


                hours:true,


                materials:true,


                hardware:true,


                photos:true,


                signature:true


            }


        });






        if(!workorder){


            return NextResponse.json(

                {

                    error:"Werkbon niet gevonden"

                },

                {

                    status:404

                }

            );


        }







        const pdf = await generateWorkorderPdf(

            workorder

        );







        return new NextResponse(

            Buffer.from(pdf),

            {

                status:200,


                headers:{


                    "Content-Type":
                    "application/pdf",


                    "Content-Disposition":
                    `attachment; filename="werkbon-${workorder.number}.pdf"`


                }


            }

        );







    } catch(error){



        console.error(

            "PDF ERROR:",

            error

        );



        return NextResponse.json(

            {

                error:"PDF genereren mislukt"

            },

            {

                status:500

            }

        );


    }


}