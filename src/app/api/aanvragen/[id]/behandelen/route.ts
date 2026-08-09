import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import {
    formatProjectHardwareStatuses,
    isProjectHardwareBesteld,
} from "@/lib/aanvraag/hardwareStatus";



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
                    bevestigingDetail?:string;
                    orientatie?:string;
                    locatie?:string;
                    berekendType?:string;
                    stroom?:string;
                    stroomMdb?:string;
                    stroomAfstand?:string;
                    stroomTraject?:string;
                    internet?:string;
                    internetMdb?:string;
                    internetAfstand?:string;
                    internetTraject?:string;
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
                const stroomDetail =
                    s.stroom === "Nee" && s.stroomMdb === "Ja"
                    ? [
                        "MDB: Ja",
                        s.stroomAfstand
                            ? `afstand ${s.stroomAfstand}`
                            : "",
                        s.stroomTraject || "",
                      ]
                        .filter(Boolean)
                        .join(", ")
                    : s.stroom === "Nee" && s.stroomMdb
                    ? `MDB: ${s.stroomMdb}`
                    : "";
                const internetDetail =
                    s.internet === "Nee" && s.internetMdb === "Ja"
                    ? [
                        "MDB: Ja",
                        s.internetAfstand
                            ? `afstand ${s.internetAfstand}`
                            : "",
                        s.internetTraject || "",
                      ]
                        .filter(Boolean)
                        .join(", ")
                    : s.internet === "Nee" && s.internetMdb
                    ? `MDB: ${s.internetMdb}`
                    : "";
                return [
                    `Scherm ${i + 1}`,
                    formaat,
                    s.bevestigingDetail || s.beugel,
                    s.orientatie,
                    s.locatie ? `@ ${s.locatie}` : "",
                    s.berekendType ? `type ${s.berekendType}` : "",
                    s.stroom
                        ? `stroom: ${s.stroom}${stroomDetail ? ` (${stroomDetail})` : ""}`
                        : "",
                    s.internet
                        ? `internet: ${s.internet}${internetDetail ? ` (${internetDetail})` : ""}`
                        : ""
                ].filter(Boolean).join(" · ");
              })
            : [];

        const specRegels:string[] = [];

        if(schermenItemsRegels.length > 0){
            specRegels.push(...schermenItemsRegels);
        }

        const kioskBlok =
            specs.kiosk && typeof specs.kiosk === "object"
            ? specs.kiosk as {
                aan?:boolean;
                velden?:Record<string,string>;
                items?:{
                    locatie?:string;
                    type?:string;
                    opmerking?:string;
                    stroom?:string;
                    stroomMdb?:string;
                    stroomAfstand?:string;
                    stroomTraject?:string;
                    internet?:string;
                    internetMdb?:string;
                    internetAfstand?:string;
                    internetTraject?:string;
                }[];
              }
            : null;

        const kioskItemsRegels =
            kioskBlok?.aan && Array.isArray(kioskBlok.items)
            ? kioskBlok.items.map((k, i)=>{
                return [
                    `Kiosk ${i + 1}`,
                    k.locatie ? `@ ${k.locatie}` : "",
                    k.type,
                    k.stroom ? `stroom: ${k.stroom}` : "",
                    k.internet ? `internet: ${k.internet}` : "",
                ].filter(Boolean).join(" · ");
              })
            : [];

        if(kioskItemsRegels.length > 0){
            specRegels.push(...kioskItemsRegels);
        }

        for(const [key, blok] of Object.entries(specs)){
            if(
                key === "project" ||
                key === "contact" ||
                key === "typeAanvraag" ||
                key === "storing" ||
                key === "geschatUren" ||
                key === "aantalMonteurs" ||
                key === "intake" ||
                key === "intakeWens" ||
                key === "projectOmschrijving" ||
                key === "projectHardwareStatus" ||
                key === "projectHardwareLevering" ||
                key === "evalue8Producten"
            ){
                continue;
            }
            // Schermen/kiosk al via items samengevat
            if(key === "schermen" && schermenItemsRegels.length > 0){
                continue;
            }
            if(key === "kiosk" && kioskItemsRegels.length > 0){
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

        const intakeWens =
            (typeof specs.intakeWens === "string" && specs.intakeWens.trim())
            || (
                specs.intake
                && typeof specs.intake === "object"
                && typeof (specs.intake as { wens?:string }).wens === "string"
                ? String((specs.intake as { wens?:string }).wens).trim()
                : ""
            );

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

        const hardwareStatusTekst =
            formatProjectHardwareStatuses(specs.projectHardwareStatus);
        const hardwareLeveringTekst =
            isProjectHardwareBesteld(specs.projectHardwareStatus)
            && typeof specs.projectHardwareLevering === "string"
            && specs.projectHardwareLevering.trim()
                ? String(specs.projectHardwareLevering).trim()
                : "";


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
                intakeWens ? `Wens klant: ${intakeWens}` : "",
                specRegels.length ? `Onderdelen: ${specRegels.join("; ")}` : "",
                isProject ? "Project (offerte-basis): Ja" : "",
                hardwareStatusTekst
                    ? `Hardware status: ${hardwareStatusTekst}`
                    : "",
                hardwareLeveringTekst
                    ? `Hardware levering: ${hardwareLeveringTekst}`
                    : "",
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
                            : typeAanvraag === "intake"
                            ? (intakeWens
                                ? `Intake: ${intakeWens}`
                                : "Intake")
                            : typeAanvraag === "uren"
                            ? (geschatUren
                                ? `Uren (geschat: ${geschatUren} dag(en)${aantalMonteurs ? `, ${aantalMonteurs} monteur(s)` : ""})`
                                : "Uren")
                            : (specRegels.length
                                ? `Installatie:\n${specRegels.map((r)=>`• ${r}`).join("\n")}`
                                : "Nieuwe installatie")),
                    internalNotes:
                        omschrijvingsdelen.join("\n"),
                    // Snapshot voor gestructureerde admin-weergave (niet in klantmail).
                    aanvraagSpecificaties:{
                        specificaties:specs,
                        aanvragerNaam:aanvraag.aanvragerNaam,
                        opmerkingen:aanvraag.opmerkingen,
                        schermen:aanvraag.schermen,
                        beugel:aanvraag.beugel,
                        stroom:aanvraag.stroom,
                        internet:aanvraag.internet,
                    },
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
