import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";



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




        const [
            workorders,
            hours
        ] =
            await Promise.all([


                prisma.workorder.findMany({

                    select:{

                        id:true,

                        status:true,

                        createdAt:true

                    }

                }),


                prisma.workorderHour.findMany({

                    include:{

                        workorder:{

                            select:{

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

                        }

                    }

                })


            ]);




        // Werkbonnen per status

        const byStatus:Record<string,number> = {};


        for(const workorder of workorders){

            byStatus[workorder.status] =
                (byStatus[workorder.status] ?? 0) + 1;

        }




        // Uren per monteur en per klant

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


        for(const entry of hours){


            const amount =
                entry.hours ?? 0;


            hoursTotal += amount;


            if(
                entry.date &&
                entry.date >= monthStart
            ){

                hoursThisMonth += amount;

            }




            const engineer =
                entry.workorder.assignedUser;


            if(engineer){


                const existing =
                    byEngineer.get(engineer.id)
                    ??
                    {
                        name:
                            engineer.name
                            ?? "Onbekend",

                        hours:0,

                        travel:0,

                        kilometers:0
                    };


                existing.hours += amount;

                existing.travel +=
                    entry.travelTime ?? 0;

                existing.kilometers +=
                    entry.kilometers ?? 0;


                byEngineer.set(
                    engineer.id,
                    existing
                );


            }




            const customer =
                entry.workorder.customer
                ??
                entry.workorder.project?.customer
                ??
                { id:"onbekend", name:"Onbekende opdrachtgever" };


            const existingCustomer =
                byCustomer.get(customer.id)
                ??
                {
                    name:customer.name,
                    hours:0
                };


            existingCustomer.hours += amount;


            byCustomer.set(
                customer.id,
                existingCustomer
            );


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
                .sort(
                    (a,b)=>b.hours - a.hours
                ),

            byCustomer:
                Array.from(byCustomer.values())
                .sort(
                    (a,b)=>b.hours - a.hours
                )

        });


    } catch(error){


        console.error(
            "REPORTS ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Rapportage ophalen mislukt"
            },

            {
                status:500
            }

        );


    }


}
