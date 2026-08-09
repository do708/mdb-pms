import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { bouwKlantWerkzaamheden } from "@/lib/aanvraag/klantWerkzaamheden";



function genereerOpdrachtnummer(){

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


        // Specificaties blijven leidend in de gestructureerde weergave;
        // description = korte klantsamenvatting; interne notities leeg.
        const specs =
            (aanvraag.specificaties && typeof aanvraag.specificaties === "object")
            ? aanvraag.specificaties as Record<string, unknown>
            : {};

        // Contactgegevens uit de aanvraag (indien ingevuld).
        const contact =
            (specs.contact && typeof specs.contact === "object")
            ? specs.contact as unknown as { persoon?:string; email?:string; telefoon?:string }
            : {};

        const typeAanvraag =
            (specs.typeAanvraag as unknown as string) || "";


        // Bijlagen uit de aanvraag als werkbon-documenten meenemen.
        const bijlagen =
            Array.isArray(aanvraag.bijlagen)
            ? (aanvraag.bijlagen as unknown as { url?:string; name?:string }[])
            : [];


        const werkorder =
            await prisma.workorder.create({
                data:{
                    number:
                        genereerOpdrachtnummer(),
                    title:
                        (aanvraag.locatie || aanvraag.customer.name),
                    // Korte klantsamenvatting voor afspraakmail (geen type/stroom/beugel).
                    description:
                        bouwKlantWerkzaamheden(specs, typeAanvraag)
                        || (typeAanvraag === "installatie" || !typeAanvraag
                            ? ""
                            : typeAanvraag),
                    // Details staan in aanvraagSpecificaties / overzicht — geen dump hier.
                    internalNotes:
                        null,
                    // Snapshot voor gestructureerde admin-weergave (niet in klantmail).
                    aanvraagSpecificaties:{
                        specificaties:specs,
                        aanvragerNaam:aanvraag.aanvragerNaam,
                        opmerkingen:aanvraag.opmerkingen,
                        schermen:aanvraag.schermen,
                        beugel:aanvraag.beugel,
                        stroom:aanvraag.stroom,
                        internet:aanvraag.internet,
                    } as object,
                    customerId:
                        aanvraag.customerId,
                    location:
                        [aanvraag.straat, aanvraag.huisnummer]
                            .filter(Boolean)
                            .join(" ")
                            .trim()
                        || null,
                    straat:
                        (aanvraag.straat || null),
                    huisnummer:
                        (aanvraag.huisnummer || null),
                    postcode:
                        (aanvraag.postcode || null),
                    city:
                        (aanvraag.plaats || null),
                    contactPersoon:
                        (contact.persoon || null),
                    contactEmail:
                        (contact.email || null),
                    contactPhone:
                        (contact.telefoon || null),
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
            { error:"Kon de aanvraag niet omzetten naar een opdracht" },
            { status:500 }
        );

    }

}
