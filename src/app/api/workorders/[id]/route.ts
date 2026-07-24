import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";





export async function GET(

    request:Request,

    {
        params
    }:{
        params: Promise<{
            id:string
        }>
    }

){


    try {


        const session =
            await auth();




        if(!session?.user?.id){


            return NextResponse.json(

                {
                    error:"Niet ingelogd"
                },

                {
                    status:401
                }

            );

        }





        const { id } =
            await params;





        const workorder =

            await prisma.workorder.findUnique({

                where:{

                    id

                },


                include:{


                    project:{

                        include:{

                            customer:true

                        }

                    },


                    assignedUser:true


                }


            });







        if(!workorder){


            return NextResponse.json(

                {
                    error:"Werkbon niet gevonden"
                },

                {
                    status:404
                }

            );


        }








        if(

            session.user.role === "engineer"

            &&

            workorder.assignedUserId !== session.user.id

        ){


            return NextResponse.json(

                {
                    error:"Geen toegang"
                },

                {
                    status:403
                }

            );


        }








        return NextResponse.json(

            workorder

        );





    } catch(error){


        console.error(

            "WORKORDER DETAIL ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Werkbon ophalen mislukt"

            },

            {

                status:500

            }

        );


    }


}









export async function PUT(

    request:Request,

    {
        params
    }:{
        params: Promise<{
            id:string
        }>
    }

){


    try {


        const session =
            await auth();





        if(!session?.user?.id){


            return NextResponse.json(

                {
                    error:"Niet ingelogd"
                },

                {
                    status:401
                }

            );

        }







        const { id } =
            await params;





        const existingWorkorder =

            await prisma.workorder.findUnique({

                where:{

                    id

                }

            });







        if(!existingWorkorder){


            return NextResponse.json(

                {
                    error:"Werkbon niet gevonden"
                },

                {
                    status:404
                }

            );


        }








        if(

            session.user.role === "engineer"

            &&

            existingWorkorder.assignedUserId !== session.user.id

        ){


            return NextResponse.json(

                {
                    error:"Geen toegang"
                },

                {
                    status:403
                }

            );


        }







        const body =
            await request.json();







        const workorder =

            await prisma.workorder.update({

                where:{

                    id

                },


                data:{


                    description:

                        body.description
                        ??
                        existingWorkorder.description,



                    internalNotes:

                        session.user.role === "engineer"
                        ?
                        existingWorkorder.internalNotes
                        :
                        body.internalNotes
                        ??
                        existingWorkorder.internalNotes,



                    status:

                        body.status
                        ??
                        existingWorkorder.status


                }


            });







        return NextResponse.json(

            workorder

        );






    } catch(error){


        console.error(

            "WORKORDER UPDATE ERROR",

            error

        );



        return NextResponse.json(

            {

                error:
                "Werkbon opslaan mislukt"

            },

            {

                status:500

            }

        );


    }


}