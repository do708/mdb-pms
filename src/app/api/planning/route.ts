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




        // Geaccepteerde verlofaanvragen -> als blokkades in de planning
        const leaveForms =
            await prisma.formSubmission.findMany({

                where:{
                    type:"verlof",
                    status:"geaccepteerd",
                    ...(
                        guard.user.role === "engineer"
                        ?
                        { userId:guard.user.id }
                        :
                        {}
                    )
                },

                include:{
                    user:{
                        select:{
                            id:true,
                            name:true
                        }
                    }
                }

            });


        // Omzetten naar simpele leave-objecten met datumbereik
        const leave =
            leaveForms.map(f=>{

                const data =
                    (f.data ?? {}) as Record<string,unknown>;

                return {
                    id:f.id,
                    userId:f.user.id,
                    userName:f.user.name,
                    from:(data.eersteDag as string) ?? null,
                    to:(data.laatsteDag as string) ?? null,
                    type:(data.typeVerlof as string) ?? "Verlof"
                };

            })
            .filter(l=>l.from);


        return NextResponse.json({
            workorders,
            leave
        });


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
