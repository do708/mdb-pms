import { NextRequest, NextResponse } from "next/server";

import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";



// Genereer (of hergebruik) de unieke publieke token van een klant en geef de
// volledige aanvraaglink terug. Alleen office/admin.
export async function POST(
    _request: NextRequest,
    { params }:{ params:Promise<{ id:string }> }
){

    try {

        const guard =
            await requireApiRole(["admin", "office"]);

        if(!guard.ok){
            return guard.response;
        }


        const { id } =
            await params;


        const customer =
            await prisma.customer.findUnique({
                where:{ id },
                select:{ id:true, publicToken:true }
            });


        if(!customer){
            return NextResponse.json(
                { error:"Opdrachtgever niet gevonden" },
                { status:404 }
            );
        }


        let token =
            customer.publicToken;


        if(!token){

            token =
                randomBytes(24).toString("hex");

            await prisma.customer.update({
                where:{ id },
                data:{ publicToken:token }
            });

        }


        const appUrl =
            (process.env.NEXT_PUBLIC_APP_URL || "https://pms.mdb-networks.nl")
                .replace(/\/$/, "");


        return NextResponse.json({
            token,
            url:`${appUrl}/aanvraag?client_id=${token}`
        });

    } catch(error){

        console.error("AANVRAAG LINK ERROR", error);

        return NextResponse.json(
            { error:"Kon de link niet aanmaken" },
            { status:500 }
        );

    }

}
