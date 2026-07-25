import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { customerName, workorderLocation, resolveCustomer } from "@/lib/workorderCustomer";

import { generateWorkorderPdf } from "@/lib/pdf/workorderPdf";
import { requireWorkorderAccess } from "@/lib/auth/guard";





export async function GET(

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


customer:true,

                    project:{

                        include:{

                            customer:true

                        }

                    },


                    hours:true,


                    materials:true,


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









        const pdf =

            await generateWorkorderPdf({

                number:
                    workorder.number,


                title:
                    workorder.title,


                description:
                    workorder.description,


                customer:
                    customerName(workorder),


                address:
                    (resolveCustomer(workorder)?.address ?? null),


                project:
                    (workorder.project?.name ?? customerName(workorder)),


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






const pdfBuffer =
    Buffer.from(pdf);



return new NextResponse(

    pdfBuffer,

    {

        headers:{

            "Content-Type":
            "application/pdf",

            "Content-Disposition":
            `attachment; filename=${workorder.number}.pdf`

        }

    }

);







    } catch(error){


        console.error(

            "PDF GENERATE ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "PDF maken mislukt"

            },

            {

                status:500

            }

        );


    }


}