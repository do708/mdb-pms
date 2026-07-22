import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";



export async function GET() {


    try {


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