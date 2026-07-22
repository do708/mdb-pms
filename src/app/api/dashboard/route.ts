import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";



export async function GET(){


    try {


        const today = new Date();





        // Werkbonnen waarvan datum voorbij is
        // maar nog geen werkbon/document aanwezig

        const missingWorkorders =
            await prisma.assignment.findMany({

                where:{

                    plannedDate:{

                        lt: today

                    },


                    workorders:{

                        none:{}

                    },


                    status:{

                        in:[
                            "gepland",
                            "bevestigd",
                            "in_uitvoering"
                        ]

                    }

                },


                include:{

                    customer:true

                }


            });








        // Opnames die niet zijn omgezet
        // en nog niet gefactureerd zijn

        const unbilledInspections =
            await prisma.assignment.findMany({

                where:{

                    type:"opname",


                    status:{

                        notIn:[

                            "gefactureerd",

                            "betaald"

                        ]

                    }

                },


                include:{

                    customer:true

                }


            });










        // Facturen die nog open staan

        const unpaidInvoices =
            await prisma.invoice.findMany({

                where:{

                    status:{

                        not:"betaald"

                    }

                },


                include:{

                    assignment:{

                        include:{

                            customer:true

                        }

                    }

                }

            });









        return NextResponse.json({

            missingWorkorders,

            unbilledInspections,

            unpaidInvoices

        });






    } catch(error){



        console.error(

            "DASHBOARD ERROR",

            error

        );



        return NextResponse.json(

            {

                error:"Dashboard gegevens ophalen mislukt"

            },

            {

                status:500

            }

        );


    }


}