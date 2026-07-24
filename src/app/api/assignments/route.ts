import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/guard";



export async function GET() {

    try {

        const guard =
            await requireApiUser();

        if(!guard.ok){
            return guard.response;
        }



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