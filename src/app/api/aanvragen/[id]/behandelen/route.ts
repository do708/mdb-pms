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
        const specs =
            (aanvraag.specificaties && typeof aanvraag.specificaties === "object")
            ? aanvraag.specificaties as Record<string, unknown>
            : {};

        const schermenBlok =
            specs.schermen && typeof specs.schermen === "object"
            ? specs.schermen as {
                aan?:boolean;
                velden?:Record<string,string>;
                items?:{
                    formaat?:string;
                    formaatAnders?:string;
                    beugel?:string;
                    orientatie?:string;
                    locatie?:string;
                    berekendType?:string;
                    stroom?:string;
                    internet?:string;
                }[];
              }
            : null;

        const schermenItemsRegels =
            schermenBlok?.aan && Array.isArray(schermenBlok.items)
            ? schermenBlok.items.map((s, i)=>{
                const formaat =
                    s.formaat === "Anders"
                    ? (s.formaatAnders || "Anders")
                    : (s.formaat || "");
                return [
                    `Scherm ${i + 1}`,
                    formaat,
                    s.beugel,
                    s.orientatie,
                    s.locatie ? `@ ${s.locatie}` : "",
                    s.berekendType ? `type ${s.berekendType}` : "",
                    s.stroom ? `stroom: ${s.stroom}` : "",
                    s.internet ? `internet: ${s.internet}` : ""
                ].filter(Boolean).join(" · ");
              })
            : [];

        const specRegels:string[] = [];

        if(schermenItemsRegels.length > 0){
            specRegels.push(...schermenItemsRegels);
        }

        for(const [key, blok] of Object.entries(specs)){
            if(
                key === "project" ||
                key === "contact" ||
                key === "typeAanvraag" ||
                key === "storing" ||
                key === "geschatUren" ||
                key === "aantalMonteurs"
            ){
                continue;
            }
            // Schermen al via items samengevat
            if(key === "schermen" && schermenItemsRegels.length > 0){
                continue;
            }
            const oud = blok as { aan?:boolean; velden?:Record<string,string> };
            if(oud && typeof oud === "object" && oud.aan){
                const velden =
                    oud.velden
                    ? Object.entries(oud.velden)
                        .filter(([,v])=>v && String(v).trim())
                        .map(([k,v])=>`${k}: ${v}`)
                        .join(", ")
                    : "";
                specRegels.push(`${key}${velden ? ` (${velden})` : ""}`);
            }
        }

        // Contactgegevens uit de aanvraag (indien ingevuld).
        const contact =
            (specs.contact && typeof specs.contact === "object")
            ? specs.contact as unknown as { persoon?:string; email?:string; telefoon?:string }
            : {};

        const typeAanvraag =
            (specs.typeAanvraag as unknown as string) || "";

        const geschatUren =
            (specs.geschatUren as unknown as string) || "";

        const aantalMonteurs =
            (specs.aantalMonteurs as unknown as string) || "";

        const storing =
            (specs.storing && typeof specs.storing === "object")
            ? specs.storing as unknown as {
                omschrijving?:string;
                hardwareVervangen?:string;
                hardwareBesteld?:string;
                hardwareLevering?:string;
              }
            : {};

        const isProject =
            (specs.project as unknown as string) === "Ja";


        const storingRegels =
            typeAanvraag === "storing"
            ? [
                storing.omschrijving ? `Storing: ${storing.omschrijving}` : "",
                storing.hardwareVervangen ? `Hardware vervangen: ${storing.hardwareVervangen}` : "",
                storing.hardwareBesteld ? `Al besteld: ${storing.hardwareBesteld}` : "",
                storing.hardwareLevering ? `Levering: ${storing.hardwareLevering}` : ""
              ]
            : [];

        const omschrijvingsdelen =
            [
                typeAanvraag ? `Type aanvraag: ${typeAanvraag}` : "",
                specRegels.length ? `Onderdelen: ${specRegels.join("; ")}` : "",
                isProject ? "Project (offerte-basis): Ja" : "",
                geschatUren ? `Geschat aantal dagen: ${geschatUren}` : "",
                aantalMonteurs ? `Aantal monteurs: ${aantalMonteurs}` : "",
                ...storingRegels,
                aanvraag.stroom ? `Stroom binnen 3m: ${aanvraag.stroom}` : "",
                aanvraag.internet ? `Internet binnen 3m: ${aanvraag.internet}` : "",
                aanvraag.aanvragerNaam ? `Aanvrager: ${aanvraag.aanvragerNaam}` : "",
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
                        (typeAanvraag === "storing"
                            ? (storing.omschrijving
                                ? `Storing: ${storing.omschrijving}`
                                : "Storing")
                            : typeAanvraag === "uren"
                            ? (geschatUren
                                ? `Uren (geschat: ${geschatUren} dag(en)${aantalMonteurs ? `, ${aantalMonteurs} monteur(s)` : ""})`
                                : "Uren")
                            : (specRegels.length
                                ? `Installatie: ${specRegels.join("; ")}`
                                : "Nieuwe installatie")),
                    internalNotes:
                        omschrijvingsdelen.join("\n"),
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
            { error:"Kon de aanvraag niet omzetten naar een werkbon" },
            { status:500 }
        );

    }

}
