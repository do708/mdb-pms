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
                            "gefactureerd"
                        ]
                    }

                },

                include:{
                    assignedUser:true
                }

            });




        // Groepeer per monteur + dag
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




        // Overlappen twee opdrachten in tijd?
        // - Zonder starttijd (alleen een datum) rekenen we als "hele dag"
        //   en dus overlappend met elke andere werkbon op die dag.
        // - Met tijden overlappen ze alleen als de intervallen elkaar raken.
        function heeftTijd(
            workorder:typeof workorders[number]
        ):boolean {

            if(!workorder.plannedDate){
                return false;
            }

            // Een puur datum-veld staat op middernacht (00:00)
            const d = workorder.plannedDate;

            return (
                d.getUTCHours() !== 0 ||
                d.getUTCMinutes() !== 0
            );

        }


        function interval(
            workorder:typeof workorders[number]
        ):[number,number] {

            const start =
                workorder.plannedDate!.getTime();

            const end =
                workorder.plannedEndDate
                ?
                workorder.plannedEndDate.getTime()
                :
                // Geen eindtijd: reken 1 uur
                start + 60 * 60 * 1000;

            return [start,end];

        }


        function overlapt(
            a:typeof workorders[number],
            b:typeof workorders[number]
        ):boolean {

            // Als een van beide geen tijd heeft: hele dag -> altijd conflict
            if(!heeftTijd(a) || !heeftTijd(b)){
                return true;
            }

            const [aStart,aEnd] = interval(a);

            const [bStart,bEnd] = interval(b);

            // Intervallen overlappen als de één begint voor de ander eindigt
            return aStart < bEnd && bStart < aEnd;

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


            // Zoek binnen de dag naar écht overlappende paren
            const overlappend =
                new Set<string>();


            for(let i = 0; i < bucket.length; i++){

                for(let j = i + 1; j < bucket.length; j++){

                    if(overlapt(bucket[i],bucket[j])){

                        overlappend.add(bucket[i].id);

                        overlappend.add(bucket[j].id);

                    }

                }

            }


            if(overlappend.size < 2){
                continue;
            }


            const betrokken =
                bucket.filter(
                    w=>overlappend.has(w.id)
                );


            conflicts.push({

                user:
                    betrokken[0].assignedUser?.name
                    ?? "Onbekend",

                date:
                    betrokken[0].plannedDate!
                    .toLocaleDateString(
                        "nl-NL",
                        {
                            weekday:"long",
                            day:"numeric",
                            month:"long"
                        }
                    ),

                workorders:
                    betrokken.map(
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
