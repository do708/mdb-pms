import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiUser } from "@/lib/auth/guard";



export async function GET(){


    try {


        const guard =
            await requireApiUser();


        if(!guard.ok){

            return guard.response;

        }




        // Monteur ziet alleen materiaal van eigen werkbonnen
        const engineerFilter =

            guard.user.role === "engineer"
            ?
            {
                workorder:{
                    assignedUserId:
                        guard.user.id
                }
            }
            :
            {};




        const materials =

            await prisma.workorderMaterial.findMany({

                where:engineerFilter,


                orderBy:{
                    createdAt:"desc"
                },


                include:{

                    workorder:{

                        select:{

                            id:true,

                            number:true,

                            title:true,

                            project:{

                                select:{

                                    name:true,

                                    customer:{

                                        select:{
                                            name:true
                                        }

                                    }

                                }

                            }

                        }

                    }

                }

            });




        return NextResponse.json(
            materials
        );


    } catch(error){


        console.error(
            "MATERIALS GET ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Materialen ophalen mislukt"
            },

            {
                status:500
            }

        );


    }


}
