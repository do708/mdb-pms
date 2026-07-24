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




        // Monteur ziet alleen zijn eigen conflicten
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
                    },

                    assignedUserId:{
                        not:null
                    },

                    status:{
                        notIn:[
                            "afgerond"
                        ]
                    }

                },


                include:{

                    assignedUser:true

                }

            });




        // Groepeer per monteur + dag; meer dan één werkbon = conflict

        const buckets =
            new Map<
                string,
                typeof workorders
            >();


        for(const workorder of workorders){


            if(
                !workorder.assignedUserId ||
                !workorder.plannedDate
            ){
                continue;
            }


            const day =
                workorder.plannedDate
                .toISOString()
                .slice(0,10);


            const key =
                `${workorder.assignedUserId}|${day}`;


            const bucket =
                buckets.get(key) ?? [];


            bucket.push(workorder);

            buckets.set(key,bucket);


        }




        const conflicts:{
            user:string;
            date:string;
            workorders:string[];
        }[] = [];


        for(const bucket of buckets.values()){


            if(bucket.length < 2){
                continue;
            }


            conflicts.push({

                user:
                    bucket[0].assignedUser?.name
                    ?? "Onbekend",

                date:
                    bucket[0].plannedDate!
                    .toLocaleDateString(
                        "nl-NL",
                        {
                            weekday:"long",
                            day:"numeric",
                            month:"long"
                        }
                    ),

                workorders:
                    bucket.map(
                        w=>`${w.number} ${w.title}`
                    )

            });


        }




        return NextResponse.json(
            conflicts
        );


    } catch(error){


        console.error(
            "CONFLICT CHECK ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Conflict controle mislukt"
            },

            {
                status:500
            }

        );


    }


}
