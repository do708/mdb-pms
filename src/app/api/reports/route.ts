import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";

import { mergeOpleverData } from "@/types/oplever";



// Hulp: een getal uit een tekstveld halen ("3,5" of "3.5" -> 3.5)
function num(value:unknown):number {

    if(typeof value === "number"){
        return isNaN(value) ? 0 : value;
    }

    if(typeof value === "string"){
        const cleaned =
            value.replace(",", ".").trim();
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
    }

    return 0;

}



export async function GET(){


    try {


        const guard =
            await requireApiRole([
                "admin",
                "office"
            ]);


        if(!guard.ok){
            return guard.response;
        }




        const now =
            new Date();


        const monthStart =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );




        // Alle werkbonnen met de gegevens die we nodig hebben. De uren,
        // reisuren en kilometers komen uit het opleverformulier (formData),
        // dus uit het bovenste gedeelte van de werkbon.
        const workorders =
            await prisma.workorder.findMany({

                select:{

                    id:true,

                    status:true,

                    createdAt:true,

                    formData:true,

                    assignedUser:{
                        select:{
                            id:true,
                            name:true
                        }
                    },

                    customer:{
                        select:{
                            id:true,
                            name:true
                        }
                    },

                    project:{
                        select:{
                            customer:{
                                select:{
                                    id:true,
                                    name:true
                                }
                            }
                        }
                    }

                }

            });




        // Werkbonnen per status
        const byStatus:Record<string,number> = {};

        for(const workorder of workorders){
            byStatus[workorder.status] =
                (byStatus[workorder.status] ?? 0) + 1;
        }




        const byEngineer =
            new Map<string,{
                name:string;
                hours:number;
                travel:number;
                kilometers:number;
            }>();


        const byCustomer =
            new Map<string,{
                name:string;
                hours:number;
            }>();


        let hoursThisMonth = 0;

        let hoursTotal = 0;




        for(const workorder of workorders){


            const oplever =
                mergeOpleverData(workorder.formData);


            // Alle monteururen bij elkaar (monteur 1 t/m 4)
            const uren =
                num(oplever.tarief.urenMonteur1) +
                num(oplever.tarief.urenMonteur2) +
                num(oplever.tarief.urenMonteur3) +
                num(oplever.tarief.urenMonteur4);


            const reisuren =
                num(oplever.tarief.reisuren);


            const kilometers =
                num(oplever.tarief.kilometers);


            hoursTotal += uren;


            if(workorder.createdAt >= monthStart){
                hoursThisMonth += uren;
            }




            // Toeschrijven aan de toegewezen monteur
            const engineer =
                workorder.assignedUser;


            if(engineer){

                const existing =
                    byEngineer.get(engineer.id)
                    ??
                    {
                        name:
                            engineer.name ?? "Onbekend",
                        hours:0,
                        travel:0,
                        kilometers:0
                    };

                existing.hours += uren;
                existing.travel += reisuren;
                existing.kilometers += kilometers;

                byEngineer.set(engineer.id, existing);

            }




            // Uren per opdrachtgever
            const customer =
                workorder.customer
                ??
                workorder.project?.customer
                ??
                { id:"onbekend", name:"Onbekende opdrachtgever" };


            const existingCustomer =
                byCustomer.get(customer.id)
                ??
                {
                    name:customer.name,
                    hours:0
                };

            existingCustomer.hours += uren;

            byCustomer.set(customer.id, existingCustomer);


        }




        return NextResponse.json({

            totals:{
                workorders:
                    workorders.length,
                hoursTotal,
                hoursThisMonth
            },

            byStatus,

            byEngineer:
                Array.from(byEngineer.values())
                .sort((a,b)=>b.hours - a.hours),

            byCustomer:
                Array.from(byCustomer.values())
                .sort((a,b)=>b.hours - a.hours)

        });


    } catch(error){


        console.error("REPORTS ERROR", error);

        return NextResponse.json(
            { error:"Rapportage ophalen mislukt" },
            { status:500 }
        );


    }


}
