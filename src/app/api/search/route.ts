import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiUser } from "@/lib/auth/guard";
import {
    agendaHitsFromEvents,
    agendaHitsFromWorkorder,
    searchAgendaRange,
    sortAndCapAgendaHits,
} from "@/lib/search/agendaHits";



// Globale zoekfunctie: opdrachten, projecten, formulieren, agenda,
// opdrachtgevers, gebruikers, documenten en aanvragen. Monteurs zien geen
// kantoor-only gegevens (gebruikers, klanten, opdrachten, documenten, aanvragen).

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
                projects:[],
                forms:[],
                users:[],
                customers:[],
                assignments:[],
                documents:[],
                aanvragen:[],
                agenda:[]
            });
        }


        const isEngineer =
            guard.user.role === "engineer";


        const like =
            { contains:q, mode:"insensitive" as const };




        // ---- Opdrachten ----
        const workorders =
            await prisma.workorder.findMany({

                where:{
                    AND:[
                        isEngineer
                        ?
                        {
                            OR:[
                                { assignedUserId:guard.user.id },
                                {
                                    extraEngineers:{
                                        some:{ userId:guard.user.id }
                                    }
                                }
                            ]
                        }
                        :
                        {},
                        {
                            OR:[
                                { number:like },
                                { title:like },
                                { location:like },
                                { city:like },
                                { project:{ name:like } },
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




        // ---- Projecten (iedereen met toegang tot /projects) ----
        const projects =
            await prisma.project.findMany({

                where:{
                    OR:[
                        { number:like },
                        { name:like },
                        { location:like },
                        { customer:{ name:like } }
                    ]
                },

                select:{
                    id:true,
                    number:true,
                    name:true,
                    location:true,
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




        const assignments =
            isEngineer
            ?
            []
            :
            await prisma.assignment.findMany({

                where:{
                    OR:[
                        { number:like },
                        { title:like },
                        { description:like },
                        { customer:{ name:like } }
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

                take:6,

                orderBy:{ createdAt:"desc" }

            });


        const documents =
            isEngineer
            ?
            []
            :
            await prisma.document.findMany({

                where:{
                    workorderId: null,
                    OR:[
                        { name:like },
                        { type:like }
                    ]
                },

                select:{
                    id:true,
                    name:true,
                    type:true
                },

                take:6,

                orderBy:{ createdAt:"desc" }

            });


        const aanvragen =
            isEngineer
            ?
            []
            :
            await prisma.aanvraag.findMany({

                where:{
                    OR:[
                        { locatie:like },
                        { straat:like },
                        { plaats:like },
                        { postcode:like },
                        { aanvragerNaam:like },
                        { customer:{ name:like } }
                    ]
                },

                select:{
                    id:true,
                    locatie:true,
                    plaats:true,
                    status:true,
                    customer:{
                        select:{ name:true }
                    }
                },

                take:6,

                orderBy:{ createdAt:"desc" }

            });


        const { rangeStart, rangeEnd } = searchAgendaRange();

        const engineerPlanningWhere = isEngineer
            ? {
                OR: [
                    { assignedUserId: guard.user.id },
                    {
                        extraEngineers: {
                            some: { userId: guard.user.id },
                        },
                    },
                ],
            }
            : {};

        const [agendaEvents, agendaWorkorders] = await Promise.all([
            prisma.planningEvent.findMany({
                where: {
                    AND: [
                        isEngineer
                            ? { assignedUserId: guard.user.id }
                            : {},
                        {
                            OR: [
                                { title: like },
                                { notes: like },
                                { assignedUser: { name: like } },
                            ],
                        },
                    ],
                },
                include: {
                    assignedUser: {
                        select: { id: true, name: true },
                    },
                },
                take: 80,
            }),
            prisma.workorder.findMany({
                where: {
                    AND: [
                        engineerPlanningWhere,
                        {
                            plannedDate: {
                                gte: rangeStart,
                                lte: rangeEnd,
                            },
                        },
                        {
                            OR: [
                                { number: like },
                                { title: like },
                                { location: like },
                                { city: like },
                                { project: { name: like } },
                                { customer: { name: like } },
                                { assignedUser: { name: like } },
                                {
                                    extraEngineers: {
                                        some: {
                                            user: { name: like },
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    location: true,
                    city: true,
                    plannedDate: true,
                    plannedEndDate: true,
                    assignedUser: {
                        select: { name: true },
                    },
                    extraEngineers: {
                        select: {
                            user: {
                                select: { name: true },
                            },
                        },
                    },
                    customer: {
                        select: { name: true },
                    },
                    project: {
                        select: {
                            customer: {
                                select: { name: true },
                            },
                        },
                    },
                },
                take: 40,
                orderBy: { plannedDate: "asc" },
            }),
        ]);

        const agenda = sortAndCapAgendaHits([
            ...agendaHitsFromEvents(agendaEvents, rangeStart, rangeEnd),
            ...agendaWorkorders.flatMap((workorder) =>
                workorder.plannedDate
                    ? agendaHitsFromWorkorder({
                        ...workorder,
                        plannedDate: workorder.plannedDate,
                    })
                    : []
            ),
        ]);


        return NextResponse.json({
            workorders,
            projects,
            forms,
            users,
            customers,
            assignments,
            documents,
            aanvragen,
            agenda
        });


    } catch(error){


        console.error("SEARCH ERROR", error);

        return NextResponse.json(
            { error:"Zoeken mislukt" },
            { status:500 }
        );


    }


}
