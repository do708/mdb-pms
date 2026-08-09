import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireWorkorderAccess } from "@/lib/auth/guard";



export async function PUT(

    request: NextRequest,

    context: {
        params: Promise<{
            id:string;
        }>
    }

) {


    try {


        const { id } = await context.params;

        const guard =
            await requireWorkorderAccess(id);

        if(!guard.ok){
            return guard.response;
        }



        const body = await request.json();



        const {

            title,

            description,

            hardware,

        } = body;





        const workorder = await prisma.workorder.findUnique({

            where:{
                id
            }

        });





        if(!workorder){


            return NextResponse.json(

                {
                    success:false,
                    error:"Opdracht niet gevonden"
                },

                {
                    status:404
                }

            );


        }







        const updatedWorkorder = await prisma.$transaction(async(tx)=>{









            await tx.workorderHardware.deleteMany({

                where:{
                    workorderId:id
                }

            });







            const updated = await tx.workorder.update({

                where:{
                    id
                },


                data:{


                    title:
                        title ??
                        workorder.title,


                    description:
                        description ??
                        workorder.description,


                }

            });












            if(hardware && hardware.length > 0){


                await tx.workorderHardware.createMany({

                    data:

                        hardware.map((item:any)=>({


                            workorderId:id,


                            name:item.name,


                            brand:
                                item.brand ?? null,


                            model:
                                item.model ?? null,


                            serialNumber:
                                item.serialNumber ?? null,


                            quantity:
                                Number(item.quantity ?? 1),


                            location:
                                item.location ?? null,


                            status:
                                item.status ?? "installed",


                        }))


                });


            }





            return updated;


        });








        return NextResponse.json({

            success:true,

            message:"Opdracht opgeslagen",

            workorder:updatedWorkorder

        });





    } catch(error){



        console.error(
            "SAVE WORKORDER ERROR:",
            error
        );



        return NextResponse.json(

            {

                success:false,

                error:"Opslaan mislukt"

            },

            {

                status:500

            }

        );


    }


}