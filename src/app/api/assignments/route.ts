import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";



export async function GET() {

    try {


        const assignments = await prisma.assignment.findMany({

            orderBy: {

                createdAt: "desc"

            },

            include: {

                customer: true,

                users: {

                    include: {

                        user: true

                    }

                },

                workorders: true,

                invoices: true

            }

        });


        return NextResponse.json(assignments);


    } catch (error) {


        console.error(
            "ASSIGNMENTS ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Opdrachten ophalen mislukt"
            },

            {
                status:500
            }

        );

    }

}