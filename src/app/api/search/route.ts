import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiUser } from "@/lib/auth/guard";



// Globale zoekfunctie: doorzoekt werkbonnen, formulieren, gebruikers en
// klanten. Kantoor/admin zien alles; een monteur ziet alleen zijn eigen
// werkbonnen en formulieren (en geen gebruikers/klanten).

export async function GET(
    request:NextRequest
){


    const guard =
        await requireApiUser();


    if(!guard.ok){
        return guard.response;
    }


    try {


        const { searchParams } =
            new URL(request.url);


        const q =
            (searchParams.get("q") ?? "").trim();


        if(q.length < 2){
            return NextResponse.json({
                workorders:[],
                forms:[],
                users:[],
                customers:[]
            });
        }


        const isEngineer =
            guard.user.role === "engineer";


        const like =
            { contains:q, mode:"insensitive" as const };




        // ---- Werkbonnen ----
        const workorders =
            await prisma.workorder.findMany({

                where:{
                    AND:[
                        isEngineer
                        ?
                        { assignedUserId:guard.user.id }
                        :
                        {},
                        {
                            OR:[
                                { number:like },
                                { title:like },
                                { location:like },
                                { customer:{ name:like } }
                            ]
                        }
                    ]
                },

                select:{
                    id:true,
                    number:true,
                    title:true,
                    status:true,
                    customer:{
                        select:{ name:true }
                    }
                },

                take:8,

                orderBy:{ createdAt:"desc" }

            });




        // ---- Formulieren ----
        const forms =
            await prisma.formSubmission.findMany({

                where:{
                    AND:[
                        isEngineer
                        ?
                        { userId:guard.user.id }
                        :
                        {},
                        {
                            OR:[
                                { title:like },
                                { type:like }
                            ]
                        }
                    ]
                },

                select:{
                    id:true,
                    type:true,
                    title:true,
                    status:true,
                    user:{
                        select:{ name:true }
                    }
                },

                take:8,

                orderBy:{ createdAt:"desc" }

            });




        // ---- Gebruikers en klanten: alleen kantoor/admin ----
        const users =
            isEngineer
            ?
            []
            :
            await prisma.user.findMany({

                where:{
                    OR:[
                        { name:like },
                        { email:like }
                    ]
                },

                select:{
                    id:true,
                    name:true,
                    email:true,
                    role:true
                },

                take:6

            });


        const customers =
            isEngineer
            ?
            []
            :
            await prisma.customer.findMany({

                where:{
                    OR:[
                        { name:like },
                        { email:like },
                        { phone:like }
                    ]
                },

                select:{
                    id:true,
                    name:true
                },

                take:6

            });




        return NextResponse.json({
            workorders,
            forms,
            users,
            customers
        });


    } catch(error){


        console.error("SEARCH ERROR", error);

        return NextResponse.json(
            { error:"Zoeken mislukt" },
            { status:500 }
        );


    }


}
