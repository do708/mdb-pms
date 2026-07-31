import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendAanvraagMail } from "@/lib/email/sendAanvraagMail";



// Publiek: haal de opdrachtgever op bij de unieke token (voor het
// aanvraagformulier). Geeft alleen de naam terug, geen gevoelige gegevens.
export async function GET(
    _request: NextRequest,
    { params }:{ params:Promise<{ token:string }> }
){

    try {

        const { token } =
            await params;


        const customer =
            await prisma.customer.findUnique({
                where:{
                    publicToken:token
                },
                select:{
                    id:true,
                    name:true
                }
            });


        if(!customer){
            return NextResponse.json(
                { error:"Onbekende of verlopen link" },
                { status:404 }
            );
        }


        return NextResponse.json({
            customerId:customer.id,
            customerName:customer.name
        });

    } catch(error){

        console.error("AANVRAAG GET ERROR", error);

        return NextResponse.json(
            { error:"Er ging iets mis" },
            { status:500 }
        );

    }

}




// Publiek: dien een aanvraag in bij deze opdrachtgever (via de token).
export async function POST(
    request: NextRequest,
    { params }:{ params:Promise<{ token:string }> }
){

    try {

        const { token } =
            await params;


        const customer =
            await prisma.customer.findUnique({
                where:{
                    publicToken:token
                }
            });


        if(!customer){
            return NextResponse.json(
                { error:"Onbekende of verlopen link" },
                { status:404 }
            );
        }


        const body =
            await request.json();


        const aanvraag =
            await prisma.aanvraag.create({
                data:{
                    customerId:customer.id,
                    locatie:body.locatie || null,
                    straat:body.straat || null,
                    huisnummer:body.huisnummer || null,
                    postcode:body.postcode || null,
                    plaats:body.plaats || null,
                    schermen:body.schermen || null,
                    beugel:body.beugel || null,
                    stroom:body.stroom || null,
                    internet:body.internet || null,
                    opmerkingen:body.opmerkingen || null,
                    aanvragerNaam:body.aanvragerNaam || null,
                    specificaties:
                        (body.specificaties && typeof body.specificaties === "object")
                        ? body.specificaties
                        : undefined,
                    bijlagen:
                        Array.isArray(body.bijlagen)
                        ? body.bijlagen
                        : []
                }
            });


        // Melding naar kantoor (mag falen zonder de aanvraag te blokkeren).
        try {
            await sendAanvraagMail({
                opdrachtgever:customer.name,
                locatie:body.locatie || "—"
            });
        } catch(mailError){
            console.error("AANVRAAG MAIL MISLUKT (aanvraag opgeslagen)", mailError);
        }


        return NextResponse.json({
            success:true,
            aanvraagId:aanvraag.id
        });

    } catch(error){

        console.error("AANVRAAG POST ERROR", error);

        return NextResponse.json(
            { error:"Aanvraag kon niet worden opgeslagen" },
            { status:500 }
        );

    }

}
