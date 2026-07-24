import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { generateWorkorderPdf } from "@/lib/pdf/workorderPdf";

import { sendWorkorderMail } from "@/lib/email/sendWorkorderMail";
import { requireWorkorderAccess } from "@/lib/auth/guard";





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

                },


                include:{


                    project:{

                        include:{

                            customer:true

                        }

                    },


                    hours:true,


                    materials:true


                }


            });







        if(!workorder){


            return NextResponse.json(

                {

                    error:
                    "Werkbon niet gevonden"

                },

                {

                    status:404

                }

            );


        }








        const updated =

            await prisma.workorder.update({

                where:{

                    id

                },


                data:{

                    status:
                    "afgerond"

                }

            });









        const pdf =

            await generateWorkorderPdf({

                number:
                    workorder.number,


                title:
                    workorder.title,


                description:
                    workorder.description,


                customer:
                    workorder.project.customer.name,


                address:
                    workorder.project.customer.address,


                project:
                    workorder.project.name,


                hours:

                    workorder.hours.reduce(

                        (total,item)=>

                            total + Number(item.hours),

                        0

                    ),



                materials:

                    workorder.materials.map(item=>({

                        name:
                            item.name,


                        quantity:
                            item.quantity

                    }))


            });








        await sendWorkorderMail({

            workorderNumber:
                workorder.number,


            customer:
                workorder.project.customer.name,


            project:
                workorder.project.name,


            pdfBuffer:
                Buffer.from(pdf)

        });









        return NextResponse.json({

            success:true,

            message:
            "Werkbon afgerond en verzonden",


            workorder:updated

        });







    } catch(error){


        console.error(

            "COMPLETE WORKORDER ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Werkbon afronden mislukt"

            },

            {

                status:500

            }

        );


    }


}