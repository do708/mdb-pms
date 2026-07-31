import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";



function genereerWerkbonnummer(){

    const year =
        new Date().getFullYear();

    const random =
        Math.floor(Math.random() * 9000) + 1000;

    return `WB-${year}-${random}`;

}



// Neem een aanvraag in behandeling: maak er een (vooringevulde) werkbon van en
// zet de aanvraag op "behandeld". Alleen office/admin.
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


        const aanvraag =
            await prisma.aanvraag.findUnique({
                where:{ id },
                include:{
                    customer:{
                        select:{ name:true }
                    }
                }
            });


        if(!aanvraag){
            return NextResponse.json(
                { error:"Aanvraag niet gevonden" },
                { status:404 }
            );
        }


        if(aanvraag.status !== "open"){
            return NextResponse.json(
                { error:"Deze aanvraag is al in behandeling genomen" },
                { status:400 }
            );
        }


        // Adres samenstellen uit de losse velden.
        const adres =
            [
                [aanvraag.straat, aanvraag.huisnummer].filter(Boolean).join(" "),
                [aanvraag.postcode, aanvraag.plaats].filter(Boolean).join(" ")
            ]
            .filter(Boolean)
            .join(", ");


        // Omschrijving/opmerkingen bundelen zodat niets verloren gaat.
        const omschrijvingsdelen =
            [
                aanvraag.schermen ? `Schermen: ${aanvraag.schermen}` : "",
                aanvraag.beugel ? `Beugel: ${aanvraag.beugel}` : "",
                aanvraag.stroom ? `Stroom binnen 3m: ${aanvraag.stroom}` : "",
                aanvraag.internet ? `Internet binnen 3m: ${aanvraag.internet}` : "",
                aanvraag.opmerkingen ? `Opmerkingen klant: ${aanvraag.opmerkingen}` : ""
            ]
            .filter(Boolean);


        // Bijlagen uit de aanvraag als werkbon-documenten meenemen.
        const bijlagen =
            Array.isArray(aanvraag.bijlagen)
            ? (aanvraag.bijlagen as unknown as { url?:string; name?:string }[])
            : [];


        const werkorder =
            await prisma.workorder.create({
                data:{
                    number:
                        genereerWerkbonnummer(),
                    title:
                        (aanvraag.locatie || aanvraag.customer.name),
                    description:
                        (aanvraag.schermen
                            ? `Installatie ${aanvraag.schermen}`
                            : "Nieuwe installatie"),
                    internalNotes:
                        omschrijvingsdelen.join("\n"),
                    customerId:
                        aanvraag.customerId,
                    location:
                        adres || null,
                    city:
                        (aanvraag.plaats || null),
                    status:
                        "ontvangen"
                }
            });


        // Bijlagen als documenten koppelen (indien aanwezig).
        if(bijlagen.length > 0){
            await prisma.document.createMany({
                data:
                    bijlagen
                        .filter((b)=>b && b.url)
                        .map((b)=>({
                            workorderId:werkorder.id,
                            name:(b.name || "bijlage"),
                            url:(b.url as string),
                            type:"aanvraag"
                        }))
            });
        }


        // Aanvraag markeren als behandeld.
        await prisma.aanvraag.update({
            where:{ id },
            data:{ status:"behandeld" }
        });


        return NextResponse.json({
            success:true,
            workorderId:werkorder.id
        });

    } catch(error){

        console.error("AANVRAAG BEHANDELEN ERROR", error);

        return NextResponse.json(
            { error:"Kon de aanvraag niet omzetten naar een werkbon" },
            { status:500 }
        );

    }

}
