import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";



export async function GET(){


    try {


        const assignments =
            await prisma.assignment.findMany({

                where:{

                    plannedDate:{

                        not:null

                    }

                },


                include:{

                    customer:true,

                    users:{

                        include:{

                            user:true

                        }

                    }

                }

            });





        const conflicts:any[] = [];





        assignments.forEach((assignment,index)=>{


            assignments.forEach((other)=>{


                if(
                    assignment.id === other.id
                )

                    return;




                if(
                    assignment.plannedDate &&
                    other.plannedDate
                ){


                    const date1 =
                        new Date(
                            assignment.plannedDate
                        )
                        .toDateString();



                    const date2 =
                        new Date(
                            other.plannedDate
                        )
                        .toDateString();




                    if(date1 !== date2)

                        return;







                    assignment.users.forEach(aUser=>{


                        other.users.forEach(bUser=>{


                            if(
                                aUser.user.id ===
                                bUser.user.id
                            ){



                                conflicts.push({

                                    user:
                                        aUser.user.name,


                                    date:
                                        date1,


                                    assignments:[

                                        assignment.title,

                                        other.title

                                    ]

                                });


                            }


                        });


                    });


                }


            });


        });







        return NextResponse.json(

            conflicts

        );






    }catch(error){


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