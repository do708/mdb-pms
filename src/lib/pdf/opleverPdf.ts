import {
    PDFDocument,
    PDFFont,
    PDFImage,
    PDFPage,
    StandardFonts,
    rgb
} from "pdf-lib";

import {
    OpleverData,
    mergeOpleverData
} from "@/types/oplever";
import {
    schermHeeftGegevens,
    splitMerkType,
    summarizeRuimtes,
    summarizeVoorziening,
} from "@/types/installatieRuimtes";
import {
    aansturingWeergave,
    bevestigingDetailWeergave,
    bevestigingSoortWeergave,
} from "@/lib/aanvraag/installatieTypes";
import {
    OPLEVER_WERKZAAMHEDEN,
    vakTitel,
    werkzaamheidVanActie,
} from "@/lib/workorders/opleverModules";
import {
    MDB_BLUE,
    MDB_NAVY,
    MDB_PINK,
    MDB_SECTION_BG,
    MDB_YELLOW,
    loadMdbLogoPng,
} from "@/lib/pdf/mdbBrand";



// ---------- kleuren uit het opleverdocument ----------

const GRAY_TEXT = rgb(0.55,0.55,0.55);

const GRAY_LINE = rgb(0.8,0.8,0.8);

const BLACK = rgb(0.15,0.15,0.15);

const YES_FILL = rgb(209 / 255, 250 / 255, 229 / 255);
const YES_TEXT = rgb(4 / 255, 120 / 255, 87 / 255);

const NO_FILL = rgb(254 / 255, 226 / 255, 226 / 255);
const NO_TEXT = rgb(185 / 255, 28 / 255, 28 / 255);

const WARN_FILL = rgb(255 / 255, 237 / 255, 213 / 255);
const WARN_TEXT = rgb(194 / 255, 65 / 255, 12 / 255);


function roundedRectPath(
    x:number,
    y:number,
    w:number,
    h:number,
    r:number
):string {

    const radius = Math.min(r, w / 2, h / 2);

    return [
        `M ${x + radius} ${y}`,
        `H ${x + w - radius}`,
        `Q ${x + w} ${y} ${x + w} ${y + radius}`,
        `V ${y + h - radius}`,
        `Q ${x + w} ${y + h} ${x + w - radius} ${y + h}`,
        `H ${x + radius}`,
        `Q ${x} ${y + h} ${x} ${y + h - radius}`,
        `V ${y + radius}`,
        `Q ${x} ${y} ${x + radius} ${y}`,
        "Z"
    ].join(" ");

}



const PAGE_WIDTH = 595;

const PAGE_HEIGHT = 842;

const MARGIN = 50;

const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const FOOTER_SPACE = 70;



export interface OpleverPdfInput {

    number:string;

    title:string;

    customerName:string;

    customerAddress:string | null;

    projectName:string;

    customerOrderNumber?:string | null;

    date:Date | null;

    engineers:(string | null)[];

    hoursTotal:number;

    materials:{
        name:string;
        quantity:number;
        unit:string | null;
    }[];

    photos:{ url:string; caption:string | null }[];

    signatureUrl:string | null;

    signedBy:string | null;

    signedAt?:Date | null;

    formData:unknown;

}



export async function generateOpleverPdf(
    input:OpleverPdfInput
){


    const data:OpleverData =
        mergeOpleverData(
            input.formData
        );


    const pdf =
        await PDFDocument.create();


    const font =
        await pdf.embedFont(
            StandardFonts.Helvetica
        );


    const bold =
        await pdf.embedFont(
            StandardFonts.HelveticaBold
        );




    // MDB-logo voor de voetregel (niet fataal als het ontbreekt)

    let logo:PDFImage | null = null;


    try {

        logo =
            await pdf.embedPng(loadMdbLogoPng());

    } catch {

        logo = null;

    }




    const dateText =
        input.date
        ?
        input.date.toLocaleDateString("nl-NL",{
            day:"2-digit",
            month:"2-digit",
            year:"numeric"
        })
        :
        "-";



    let page!:PDFPage;

    let y = 0;


    function newPage(){

        page =
            pdf.addPage([
                PAGE_WIDTH,
                PAGE_HEIGHT
            ]);


        const headerBottom = PAGE_HEIGHT - 78;

        if(logo){
            const h = 36;
            const scale = h / logo.height;
            page.drawImage(logo,{
                x:MARGIN,
                y:PAGE_HEIGHT - 22 - h,
                width:logo.width * scale,
                height:h
            });
        } else {
            page.drawText("MDB Networks",{
                x:MARGIN,
                y:PAGE_HEIGHT - 42,
                size:13,
                font:bold,
                color:MDB_NAVY
            });
            page.drawText("Data- Telecom- en Narrowcasting Installaties",{
                x:MARGIN,
                y:PAGE_HEIGHT - 56,
                size:7,
                font,
                color:GRAY_TEXT
            });
        }

        const docLabel = "OPLEVERDOCUMENT";
        page.drawText(docLabel,{
            x:PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(docLabel,8),
            y:PAGE_HEIGHT - 36,
            size:8,
            font:bold,
            color:GRAY_TEXT
        });

        page.drawText(input.number,{
            x:PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(input.number,16),
            y:PAGE_HEIGHT - 56,
            size:16,
            font:bold,
            color:MDB_PINK
        });

        page.drawLine({
            start:{ x:MARGIN, y:headerBottom },
            end:{ x:PAGE_WIDTH - MARGIN, y:headerBottom },
            thickness:3,
            color:MDB_BLUE
        });

        y = headerBottom - 18;

    }


    function ensure(height:number){

        if(y - height < FOOTER_SPACE){

            newPage();

        }

    }




    function wrap(
        text:string,
        size:number,
        useFont:PDFFont,
        maxWidth:number
    ):string[] {

        const words =
            text.split(/\s+/);

        const lines:string[] = [];

        let current = "";


        for(const word of words){

            const test =
                current
                ?
                `${current} ${word}`
                :
                word;

            if(
                useFont.widthOfTextAtSize(test,size)
                > maxWidth
                &&
                current
            ){
                lines.push(current);
                current = word;
            } else {
                current = test;
            }

        }

        if(current){
            lines.push(current);
        }

        return lines;

    }


    function drawDataTable(headers:string[], rows:string[][]){

        if(rows.length === 0){
            return;
        }

        const cols = headers.length;
        const colW = CONTENT_WIDTH / cols;
        const size = 7;
        const pad = 2;

        function rowHeight(cells:string[]){
            let h = 14;
            for(const cell of cells){
                const n = wrap(cell || "—", size, font, Math.max(12, colW - pad * 2)).length;
                h = Math.max(h, n * 9 + 6);
            }
            return h;
        }

        ensure(18);
        page.drawRectangle({
            x:MARGIN,
            y:y - 12,
            width:CONTENT_WIDTH,
            height:16,
            color:MDB_NAVY
        });
        headers.forEach((header, i)=>{
            const clipped = wrap(header, size, bold, Math.max(12, colW - pad * 2))[0] || header;
            page.drawText(clipped,{
                x:MARGIN + i * colW + pad,
                y:y - 8,
                size,
                font:bold,
                color:rgb(1, 1, 1)
            });
        });
        y -= 16;

        for(const [rowIndex, cells] of rows.entries()){
            const h = rowHeight(cells);
            ensure(h);
            if(rowIndex % 2 === 0){
                page.drawRectangle({
                    x:MARGIN,
                    y:y - h + 4,
                    width:CONTENT_WIDTH,
                    height:h,
                    color:MDB_SECTION_BG
                });
            }
            cells.forEach((cell, i)=>{
                wrap(cell || "—", size, font, Math.max(12, colW - pad * 2)).forEach((line, li)=>{
                    page.drawText(line,{
                        x:MARGIN + i * colW + pad,
                        y:y - 8 - li * 9,
                        size,
                        font,
                        color:BLACK
                    });
                });
            });
            y -= h;
        }

        y -= 8;

    }




    function text(
        value:string,
        options:{
            size?:number;
            useBold?:boolean;
            color?:ReturnType<typeof rgb>;
            gap?:number;
        } = {}
    ){

        const size =
            options.size ?? 9;

        const useFont =
            options.useBold ? bold : font;

        const lines =
            wrap(value,size,useFont,CONTENT_WIDTH);


        for(const line of lines){

            ensure(size + 4);

            page.drawText(line,{
                x:MARGIN,
                y,
                size,
                font:useFont,
                color:options.color ?? BLACK
            });

            y -= size + 4;

        }

        y -= options.gap ?? 0;

    }




    function sectionBar(label:string){

        ensure(44);

        y -= 16;

        page.drawRectangle({
            x:MARGIN,
            y:y - 5,
            width:CONTENT_WIDTH,
            height:17,
            color:MDB_SECTION_BG
        });

        page.drawRectangle({
            x:MARGIN,
            y:y - 5,
            width:4,
            height:17,
            color:MDB_PINK
        });

        page.drawText(label,{
            x:MARGIN + 10,
            y,
            size:9,
            font:bold,
            color:MDB_NAVY
        });

        y -= 22;

    }




    function dashedLine(){

        ensure(8);

        page.drawLine({
            start:{ x:MARGIN, y:y + 2 },
            end:{ x:PAGE_WIDTH - MARGIN, y:y + 2 },
            thickness:0.5,
            color:GRAY_LINE,
            dashArray:[2,2]
        });

        y -= 8;

    }




    function badges(
        options:{
            label:string;
            active:boolean;
            color:ReturnType<typeof rgb>;
            textColor?:ReturnType<typeof rgb>;
        }[]
    ){

        ensure(24);

        let x = MARGIN;


        for(const option of options){

            const width =
                font.widthOfTextAtSize(option.label,8)
                + 20;


            if(option.active){

                page.drawRectangle({
                    x,
                    y:y - 4,
                    width,
                    height:15,
                    color:option.color
                });

                page.drawText(option.label,{
                    x:x + 10,
                    y,
                    size:8,
                    font:bold,
                    color:option.textColor ?? BLACK
                });

            } else {

                page.drawSvgPath(
                    roundedRectPath(x, y - 4, width, 15, 7),
                    { borderColor:GRAY_LINE, borderWidth:0.8 }
                );

                page.drawText(option.label,{
                    x:x + 10,
                    y,
                    size:8,
                    font,
                    color:GRAY_TEXT
                });

            }


            x += width + 8;

        }

        y -= 22;

    }




    function jaNee(
        label:string,
        value:boolean | null,
        labels:[string,string] = ["Ja","Nee"],
        required = false
    ){

        if(value === null && !required){
            return;
        }

        text(label);

        const selected = value === true ? labels[0] : labels[1];
        badges([{
            label:selected,
            active:true,
            color:value === true ? YES_FILL : NO_FILL,
            textColor:value === true ? YES_TEXT : NO_TEXT
        }]);

        dashedLine();

    }




    function keuze(
        label:string,
        value:string,
        options:string[],
        required = false
    ){

        if(!value && !required){
            return;
        }

        text(label);

        const negative = value === "Nee" || value === "n.v.t." || value === "Slecht";
        badges([{
            label:value,
            active:true,
            color:
                value === "Matig"
                ? WARN_FILL
                : negative
                    ? NO_FILL
                    : YES_FILL,
            textColor:
                value === "Matig"
                ? WARN_TEXT
                : negative
                    ? NO_TEXT
                    : YES_TEXT
        }]);

        dashedLine();

    }




    function labelValue(
        label:string,
        value:string
    ){

        if(!value){
            return;
        }

        text(label,{ useBold:true });

        text(value,{ gap:2 });

        dashedLine();

    }




    // ================= Pagina 1: Projectgegevens =================

    newPage();


    text("Project- en werkbongegevens",{
        size:13,
        useBold:true,
        gap:10
    });


    // klantnaam-balk zoals in het origineel

    ensure(30);

    page.drawRectangle({
        x:MARGIN,
        y:y - 6,
        width:CONTENT_WIDTH,
        height:20,
        color:MDB_SECTION_BG
    });

    page.drawText(input.title,{
        x:MARGIN + 8,
        y,
        size:12,
        font:bold,
        color:BLACK
    });

    y -= 34;


    labelValue("Project- / werkbonnaam:", input.title);
    labelValue("Opdrachtgever:", input.customerName);
    labelValue("Opdrachtnummer opdrachtgever:", input.customerOrderNumber ?? "");

    labelValue(
        "Adres:",
        input.customerAddress ?? ""
    );

    labelValue(
        "Datum:",
        dateText
    );


    y -= 6;


    // monteurs naast elkaar — alleen wie op deze opdracht staat

    const assignedEngineers =
        input.engineers
        .map((name)=> (name || "").trim())
        .filter(Boolean);

    if(assignedEngineers.length > 0){

        ensure(34);

        const engineerColumn =
            CONTENT_WIDTH / Math.max(assignedEngineers.length, 1);


        for(let index = 0; index < assignedEngineers.length; index++){

            const x =
                MARGIN + index * engineerColumn;

            page.drawText(`Monteur ${index + 1}:`,{
                x,
                y,
                size:9,
                font,
                color:GRAY_TEXT
            });

            page.drawText(assignedEngineers[index],{
                x,
                y:y - 13,
                size:9,
                font,
                color:BLACK
            });

        }

        y -= 34;

    }




    // ================= Installatiegegevens =================

    sectionBar("Installatiegegevens:");


    text("Tarief & Uren",{ useBold:true, gap:2 });


    jaNee(
        "Voorrijtarief?",
        data.tarief.voorrijtarief,
        ["Vast","KM's + Uren"]
    );


    if(data.tarief.voorrijtarief === false){

        labelValue(
            "Aantal gereden kilometers:",
            data.tarief.kilometers
        );

        labelValue(
            "Reisuren:",
            data.tarief.reisuren
        );

    }

    labelValue(
        `Uren (regiebasis, totaal geregistreerd):`,
        input.hoursTotal
        ?
        `${input.hoursTotal} uur`
        :
        ""
    );

    labelValue(
        "Parkeerkosten:",
        data.tarief.parkeerkosten.kosten
    );

    labelValue(
        "Materiaalkosten:",
        data.tarief.materiaalkosten.kosten
    );

    labelValue(
        "Hotel / sejour:",
        data.tarief.sejour.kosten
    );


    text("Installatie werkzaamheden",{ useBold:true, gap:2 });

    {
        const ruimtes = data.installatie.ruimtes || [];
        const heeftRuimtes = ruimtes.some(
            (r) => r.werkzaamheid || r.naam || (r.schermen && r.schermen.length)
        );

        if (heeftRuimtes) {
            for (const item of OPLEVER_WERKZAAMHEDEN) {
                const vanType = ruimtes.filter((r) =>
                    (werkzaamheidVanActie(r.actie) || "montage") === item.key
                    && (
                        r.werkzaamheid
                        || r.naam
                        || (r.schermen || []).some((s) => schermHeeftGegevens(s))
                    )
                );
                if (vanType.length === 0) {
                    continue;
                }
                text(vakTitel("Scherm", item.key),{ useBold:true, gap:2 });
                for (const regel of summarizeRuimtes(vanType)) {
                    text(`• ${regel}`, { gap: 1 });
                }
                const schermRows:string[][] = [];
                const playerRows:string[][] = [];
                for (const [ruimteIndex, ruimte] of vanType.entries()) {
                    const ruimteNaam = (ruimte.naam || "").trim() || `Ruimte ${ruimteIndex + 1}`;
                    for (const [schermIndex, scherm] of (ruimte.schermen || []).entries()) {
                        if (!schermHeeftGegevens(scherm)) {
                            continue;
                        }
                        const formaat =
                            scherm.formaat === "Anders"
                            ? (scherm.formaatAnders || "Anders")
                            : scherm.formaat;
                        const schermLabel = scherm.label || `Scherm ${schermIndex + 1}`;
                        const bevestiging = [
                            bevestigingSoortWeergave(scherm.beugel) || scherm.beugel,
                            bevestigingDetailWeergave(scherm.bevestigingDetail),
                            scherm.plafondHoogte,
                        ].filter(Boolean).join(" · ");
                        schermRows.push([
                            ruimteNaam,
                            schermLabel,
                            scherm.locatie || "",
                            formaat || "",
                            scherm.merk || splitMerkType(scherm.merkType || "").merk,
                            scherm.type || splitMerkType(scherm.merkType || "").type,
                            scherm.serienummer || "",
                            bevestiging,
                        ]);
                        const aansturing =
                            scherm.aansturing === "Anders"
                            ? (scherm.aansturingAnders || "Anders")
                            : aansturingWeergave(scherm.aansturing);
                        const playerMerk =
                            scherm.playerMerk
                            || splitMerkType(scherm.playerMerkType || "").merk;
                        const playerType =
                            scherm.playerType
                            || splitMerkType(scherm.playerMerkType || "").type;
                        if (
                            aansturing
                            || playerMerk
                            || playerType
                            || scherm.playerSerienummer
                        ) {
                            playerRows.push([
                                schermLabel,
                                aansturing || "",
                                playerMerk,
                                playerType,
                                scherm.playerSerienummer || "",
                            ]);
                        }
                    }
                }
                drawDataTable(
                    ["Ruimte","Scherm","Locatie","Formaat","Merk","Type","SN","Bevestiging"],
                    schermRows
                );
                if (playerRows.length > 0) {
                    text("Player / aansturing",{ useBold:true, gap:2 });
                    drawDataTable(
                        ["Scherm","Aansturing","Merk","Type","SN"],
                        playerRows
                    );
                }
            }

            const stroomTekst = summarizeVoorziening(
                "Stroom",
                data.installatie.stroomBlok
            );
            if (stroomTekst) {
                text(stroomTekst, { gap: 1 });
            }

            const internetTekst = summarizeVoorziening(
                "Internet",
                data.installatie.internetBlok
            );
            if (internetTekst) {
                text(internetTekst, { gap: 1 });
            }
        } else {
            // legacy layout
    jaNee(
        "Heb je nieuwe schermen geïnstalleerd?",
        data.installatie.nieuweSchermen
    );

    jaNee(
        "Heb je hergebruikte schermen geïnstalleerd?",
        data.installatie.hergebruikteSchermen
    );

    labelValue(
        "Welk formaat scherm?",
        [
            ...data.installatie.nieuweFormaten,
            ...data.installatie.hergebruikteFormaten
        ]
            .filter((b) => b.formaat || b.aantal)
            .map((b) =>
                [b.aantal ? `${b.aantal}x` : "", b.formaat]
                    .filter(Boolean)
                    .join(" ")
            )
            .join(", ")
    );

    jaNee(
        "Heb je tilhulp gehad?",
        [
            ...data.installatie.nieuweFormaten,
            ...data.installatie.hergebruikteFormaten
        ].some((b) => b.tilhulp)
    );

    labelValue(
        "Hoeveel schermen van dit formaat?",
        String(
            [
            ...data.installatie.nieuweFormaten,
            ...data.installatie.hergebruikteFormaten
        ]
                .reduce((som, b) => som + (parseInt(b.aantal, 10) || 0), 0)
        )
    );

    {
        const orientaties =
            [
            ...data.installatie.nieuweFormaten,
            ...data.installatie.hergebruikteFormaten
        ]
                .map((b) => b.orientatie)
                .filter(Boolean)
                .join(", ");

        if(orientaties){
            labelValue(
                "Oriëntatie:",
                orientaties
            );
        }
    }

    labelValue(
        "Type beugel:",
        [
            ...data.installatie.nieuweFormaten,
            ...data.installatie.hergebruikteFormaten
        ]
            .map((b) => b.typeBeugel)
            .filter(Boolean)
            .join(", ")
    );

    labelValue(
        "Aantal schermen ingesteld:",
        [
            ...data.installatie.nieuweFormaten,
            ...data.installatie.hergebruikteFormaten
        ]
            .map((b) => b.aantalIngesteld)
            .filter(Boolean)
            .join(", ")
    );

        } // end legacy else

        if(data.installatie.videowall){
            text("Videowall",{ useBold:true, gap:2 });
            text("Ja",{ gap:2 });
            dashedLine();
        }

        if(data.installatie.kiosk){
            text("Kiosk",{ useBold:true, gap:2 });
            text("Ja",{ gap:2 });
            dashedLine();
        }

        if(data.installatie.mediaplayers){
            text("Mediaplayers",{ useBold:true, gap:2 });
            keuze(
                "Heb je mediaplayers;",
                data.installatie.mediaplayers,
                ["Geïnstalleerd","Gedemonteerd"]
            );
            labelValue(
                "Aantal:",
                data.installatie.aantalMediaplayers
            );
        }

        if(data.installatie.audio){
            text("Audio",{ useBold:true, gap:2 });
            text("Ja",{ gap:2 });
            dashedLine();
        }
    }


    jaNee(
        "Project (offerte basis) — is het een project?",
        data.installatie.isProject
    );


    labelValue(
        "Opmerkingen:",
        data.installatie.opmerkingen
    );




    // ================= Gebruikte materialen =================

    const beugels:[string,string][] = [
        ["Muurbeugel",data.materialen.muurbeugel],
        ["Zwenkbeugel",data.materialen.zwenkbeugel],
        ["Plafondbeugel 150cm",data.materialen.plafond150],
        ["Plafondbeugel 300cm",data.materialen.plafond300],
        ["Vloerstandaard",data.materialen.vloerstandaard],
        ["Overig",data.materialen.overigBeugel]
    ];

    const beugelText =
        beugels
        .filter(([,amount])=>amount)
        .map(([name,amount])=>`${name}: ${amount}`)
        .join("   ·   ");

    const patch:[string,string][] = [
        ["1 m",data.materialen.patch1],
        ["2 m",data.materialen.patch2],
        ["3 m",data.materialen.patch3],
        ["5 m",data.materialen.patch5],
        ["7,5 m",data.materialen.patch75],
        ["10 m",data.materialen.patch10]
    ];

    const patchText =
        patch
        .filter(([,amount])=>amount)
        .map(([name,amount])=>`Patch kabel ${name}: ${amount}`)
        .join("   ·   ");

    const verleng:[string,string][] = [
        ["1,5 m",data.materialen.verleng15],
        ["3 m",data.materialen.verleng3],
        ["5 m",data.materialen.verleng5]
    ];

    const verlengText =
        verleng
        .filter(([,amount])=>amount)
        .map(([name,amount])=>`3-voudig ${name}: ${amount}`)
        .join("   ·   ");

    const hdmiText =
        [
            ["HDMI 1 m",data.materialen.hdmi1m],
            ["HDMI 2 m",data.materialen.hdmi2m],
            ["HDMI 3 m",data.materialen.hdmi3m],
            ["HDMI 5 m",data.materialen.hdmi5m],
            ["HDMI 7,5 m",data.materialen.hdmi75m],
            ["HDMI 10 m",data.materialen.hdmi10m]
        ]
        .filter(([,amount])=>amount)
        .map(([name,amount])=>`${name}: ${amount}`)
        .join("   ·   ");

    const heeftMaterialen =
        input.materials.length > 0
        || Boolean(beugelText)
        || Boolean(patchText)
        || Boolean(verlengText)
        || Boolean(hdmiText)
        || Boolean(data.materialen.opmerkingen.trim());

    if(heeftMaterialen){
    sectionBar("Gebruikte materialen:");

    if(beugelText){

        text(beugelText,{ gap:2 });

        dashedLine();

    }

    if(patchText){

        text(patchText,{ gap:2 });

        dashedLine();

    }

    if(hdmiText){

        text(hdmiText,{ gap:2 });

        dashedLine();

    }

    if(verlengText){

        text(verlengText,{ gap:2 });

        dashedLine();

    }

    labelValue(
        "Opmerkingen:",
        data.materialen.opmerkingen
    );


    // vrije materiaalregels uit de werkbon

    if(input.materials.length > 0){

        text("Overige materialen (opdracht):",{ useBold:true, gap:2 });

        for(const material of input.materials){

            text(
                `${material.quantity} ${material.unit ?? "x"}  ${material.name}`,
                { gap:1 }
            );

        }

        dashedLine();

    }
    }




    // ================= Checklist =================

    const checklist = data.checklist;
    const heeftChecklist =
        checklist.werkendOpgeleverd !== null
        || checklist.lichtnetSchakelbaar !== null
        || checklist.wifiVanToepassing !== null
        || Boolean(checklist.remoteServices)
        || Boolean(checklist.locatieMediaplayer)
        || Boolean(checklist.aantalMediaplayers)
        || checklist.afvalverwijdering !== null
        || (
            checklist.mediaplayerLocaties
            && typeof checklist.mediaplayerLocaties === "object"
            && Object.keys(checklist.mediaplayerLocaties).length > 0
        );

    if(heeftChecklist){

    newPage();
    sectionBar("Checklist:");


    jaNee(
        "Is de installatie werkend opgeleverd?",
        data.checklist.werkendOpgeleverd,
        ["Ja","Nee"]
    );

    jaNee(
        "Is de hardware aangesloten op een handmatig schakelbaar stroompunt?",
        data.checklist.lichtnetSchakelbaar,
        ["Ja","Nee"]
    );

    jaNee(
        "Wifi-verbinding van toepassing?",
        data.checklist.wifiVanToepassing,
        ["Ja","Nee"]
    );

    if(data.checklist.wifiVanToepassing === true){

        keuze(
            "Is de WiFi verbinding sterk genoeg?",
            data.checklist.wifiSterkte,
            ["Ja","Matig","Slecht"]
        );

    }

    keuze(
        "Zijn de schermen gekoppeld aan Remote Services?",
        data.checklist.remoteServices,
        ["Ja","Nee","n.v.t."]
    );

    keuze(
        "Wat is de locatie van de mediaplayer(s)?",
        data.checklist.locatieMediaplayer,
        [
            "Achter het scherm",
            "In de patchkast",
            "Boven het plafond",
            "Kiosk",
            "Anders"
        ]
    );

    labelValue(
        "Aantal mediaplayers:",
        data.checklist.aantalMediaplayers
    );

    jaNee(
        "Afval verwijderd?",
        data.checklist.afvalverwijdering,
        ["Ja","Nee"]
    );

    }




    // ================= Foto's =================

    if(input.photos.length > 0){

        sectionBar("Foto's:");


        const photoWidth =
            (CONTENT_WIDTH - 20) / 2;

        let column = 0;

        let rowHeight = 0;


        for(const photo of input.photos){


            let image:PDFImage | null = null;


            try {

                const response =
                    await fetch(photo.url);

                if(!response.ok){
                    continue;
                }

                const bytes =
                    new Uint8Array(
                        await response.arrayBuffer()
                    );

                try {
                    image = await pdf.embedJpg(bytes);
                } catch {
                    image = await pdf.embedPng(bytes);
                }

            } catch {

                continue;

            }


            const scale =
                photoWidth / image.width;

            const height =
                Math.min(
                    image.height * scale,
                    240
                );

            const width =
                image.width *
                (height / image.height);

            const captionLines = photo.caption
                ? wrap(photo.caption, 8, font, photoWidth).slice(0, 3)
                : [];
            const itemHeight = height + (captionLines.length ? captionLines.length * 10 + 5 : 0);

            if(column === 1 && y - itemHeight < FOOTER_SPACE){
                y -= rowHeight + 12;
                column = 0;
                rowHeight = 0;
            }

            if(column === 0){

                ensure(itemHeight + 12);

                rowHeight = itemHeight;

            } else {

                // tweede kolom kan lager zijn; hoogste telt
                rowHeight =
                    Math.max(rowHeight,itemHeight);

            }


            page.drawImage(image,{
                x:
                    MARGIN +
                    column * (photoWidth + 20) +
                    (photoWidth - width) / 2,
                y:y - height,
                width,
                height
            });

            captionLines.forEach((line,index)=>{
                const lineWidth = font.widthOfTextAtSize(line, 8);
                page.drawText(line,{
                    x:
                        MARGIN +
                        column * (photoWidth + 20) +
                        Math.max(0, (photoWidth - lineWidth) / 2),
                    y:y - height - 11 - index * 10,
                    size:8,
                    font,
                    color:BLACK
                });
            });

            if(column === 1){

                y -= rowHeight + 12;

                column = 0;

                rowHeight = 0;

            } else {

                column = 1;

            }

        }


        if(column === 1){

            y -= rowHeight + 12;

        }

    }




    // ================= Afronding =================
    {
        const gereed = data.afronding.werkzaamhedenGereed;
        sectionBar("Afronding:");
        if (gereed === "gereed") {
            jaNee("Werkzaamheden gereed?", true, ["Gereed", "Niet gereed"]);
        } else if (gereed === "niet_gereed") {
            jaNee("Werkzaamheden gereed?", false, ["Gereed", "Niet gereed"]);
            labelValue(
                "Omschrijving niet gereed:",
                data.afronding.nietGereedOmschrijving
            );
        } else {
            text("Werkzaamheden gereed? (niet ingevuld)", { gap: 2 });
        }
    }

    // ================= Handtekening =================

    if(input.signatureUrl || input.signedBy){
    sectionBar("Handtekening:");


    ensure(140);


    page.drawText("Ondertekend door:",{
        x:MARGIN,
        y,
        size:9,
        font,
        color:BLACK
    });


    if(input.signedBy){

        page.drawText(input.signedBy,{
            x:MARGIN + 160,
            y,
            size:9,
            font,
            color:BLACK
        });

    }

    if(input.signedAt){
        const signedAtText = input.signedAt.toLocaleString("nl-NL",{
            day:"2-digit",
            month:"2-digit",
            year:"numeric",
            hour:"2-digit",
            minute:"2-digit"
        });
        page.drawText(signedAtText,{
            x:PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(signedAtText,9),
            y,
            size:9,
            font,
            color:GRAY_TEXT
        });
    }

    y -= 14;


    page.drawSvgPath(
        roundedRectPath(MARGIN, y - 110, 200, 110, 12),
        {
            borderColor:GRAY_LINE,
            borderWidth:0.8
        }
    );


    if(input.signatureUrl){

        try {

            const response =
                await fetch(input.signatureUrl);

            if(response.ok){

                const bytes =
                    new Uint8Array(
                        await response.arrayBuffer()
                    );

                let image:PDFImage;

                try {
                    image = await pdf.embedPng(bytes);
                } catch {
                    image = await pdf.embedJpg(bytes);
                }

                const scale =
                    Math.min(
                        180 / image.width,
                        90 / image.height
                    );

                page.drawImage(image,{
                    x:MARGIN + 10,
                    y:y - 100,
                    width:image.width * scale,
                    height:image.height * scale
                });

            }

        } catch {

            // handtekening niet kunnen laden - kader blijft leeg

        }

    }

    y -= 125;
    }




    // ================= Voetregel op elke pagina =================

    const pages =
        pdf.getPages();


    pages.forEach((current,index)=>{


        current.drawLine({
            start:{ x:MARGIN, y:45 },
            end:{ x:PAGE_WIDTH - MARGIN, y:45 },
            thickness:1,
            color:MDB_YELLOW
        });


        current.drawText("MDB Networks",{
            x:MARGIN,
            y:24,
            size:9,
            font:bold,
            color:MDB_NAVY
        });


        current.drawText(
            "Data- Telecom- en Narrowcasting Installaties",
            {
                x:MARGIN,
                y:14,
                size:6,
                font,
                color:GRAY_TEXT
            }
        );


        const pageLabel =
            `${index + 1} / ${pages.length}`;

        current.drawText(pageLabel,{
            x:
                PAGE_WIDTH - MARGIN -
                font.widthOfTextAtSize(pageLabel,9),
            y:20,
            size:9,
            font,
            color:BLACK
        });


    });




    return pdf.save();

}
