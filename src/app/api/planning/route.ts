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




        // Monteur ziet alleen zijn eigen planning
        const engineerFilter =

            guard.user.role === "engineer"
            ?
            {
                assignedUserId:
                    guard.user.id
            }
            :
            {};




        const workorders =

            await prisma.workorder.findMany({

                where:{

                    ...engineerFilter,

                    plannedDate:{
                        not:null
                    }

                },


                orderBy:{
                    plannedDate:"asc"
                },


                include:{

                    customer:true,

                    project:{

                        include:{
                            customer:true
                        }

                    },

                    assignedUser:true

                }

            });




        return NextResponse.json(
            workorders
        );


    } catch(error){


        console.error(
            "PLANNING ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Planning ophalen mislukt"
            },

            {
                status:500
            }

        );


    }


}
