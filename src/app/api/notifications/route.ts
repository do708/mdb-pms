import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";



// Werkbonnen die te laat zijn met invullen: klaargezet, geplande datum
// verstreken, en de monteur heeft ze nog niet ingevuld (status voor
// "uitgevoerd"). Kantoor kan hierop de monteur aanspreken.

export async function GET(){


    const guard =
        await requireApiRole(["admin","office"]);


    if(!guard.ok){

        return guard.response;

    }


    try {


        const startVandaag =
            new Date();

        startVandaag.setHours(0,0,0,0);




        const teLaat =
            await prisma.workorder.findMany({

                where:{

                    plannedDate:{
                        lt:startVandaag
                    },

                    status:{
                        in:[
                            "ontvangen",
                            "afspraak",
                            "materiaal",
                            "ingepland"
                        ]
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




        // Recent verstuurde werkbonnen (door de monteur uitgevoerd/verstuurd).
        // Kantoor/projects ziet deze als melding om af te handelen.
        const zevenDagenGeleden =
            new Date();
        zevenDagenGeleden.setDate(zevenDagenGeleden.getDate() - 7);


        const verstuurd =
            await prisma.workorder.findMany({

                where:{
                    status:"uitgevoerd",
                    sentAt:{
                        gte:zevenDagenGeleden
                    }
                },

                orderBy:{
                    sentAt:"desc"
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




        const items =
            [
                ...verstuurd.map(w=>({ ...w, soort:"verstuurd" })),
                ...teLaat.map(w=>({ ...w, soort:"telaat" }))
            ];




        return NextResponse.json({

            count:items.length,

            items

        });


    } catch(error){


        console.error(
            "NOTIFICATIONS ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Meldingen ophalen mislukt"
            },

            {
                status:500
            }

        );


    }


}
