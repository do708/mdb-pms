import {
    PDFDocument,
    PDFFont,
    PDFImage,
    PDFPage,
    StandardFonts,
    rgb
} from "pdf-lib";

import { readFileSync } from "node:fs";

import { join } from "node:path";

import {
    OpleverData,
    mergeOpleverData
} from "@/types/oplever";



// ---------- kleuren uit het opleverdocument ----------

const TEAL = rgb(0.16,0.72,0.68);

const GREEN = rgb(0.42,0.72,0.42);

const BLUE = rgb(0.35,0.71,0.92);

const GRAY_BG = rgb(0.93,0.93,0.93);

const GRAY_TEXT = rgb(0.55,0.55,0.55);

const GRAY_LINE = rgb(0.8,0.8,0.8);

const BLACK = rgb(0.15,0.15,0.15);



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

    date:Date | null;

    engineers:(string | null)[];

    hoursTotal:number;

    materials:{
        name:string;
        quantity:number;
        unit:string | null;
    }[];

    photoUrls:string[];

    signatureUrl:string | null;

    signedBy:string | null;

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

        const bytes =
            readFileSync(
                join(
                    process.cwd(),
                    "public/images/MDB-Logo.png"
                )
            );

        logo =
            await pdf.embedPng(bytes);

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


    const headerTitle =
        `${input.customerName} Opleverdocument`;


    const headerSub =
        `${input.number} ${input.title}, ${dateText}`;




    let page!:PDFPage;

    let y = 0;


    function newPage(){

        page =
            pdf.addPage([
                PAGE_WIDTH,
                PAGE_HEIGHT
            ]);


        // kopregel

        page.drawText(headerTitle,{
            x:MARGIN,
            y:PAGE_HEIGHT - 55,
            size:11,
            font:bold,
            color:BLACK
        });


        page.drawText(dateText,{
            x:PAGE_WIDTH - MARGIN -
                font.widthOfTextAtSize(dateText,10),
            y:PAGE_HEIGHT - 55,
            size:10,
            font,
            color:BLACK
        });


        page.drawText(headerSub,{
            x:MARGIN,
            y:PAGE_HEIGHT - 70,
            size:9,
            font,
            color:GRAY_TEXT
        });


        page.drawLine({
            start:{ x:MARGIN, y:PAGE_HEIGHT - 85 },
            end:{ x:PAGE_WIDTH - MARGIN, y:PAGE_HEIGHT - 85 },
            thickness:1,
            color:TEAL
        });


        y = PAGE_HEIGHT - 105;

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

        ensure(30);

        y -= 6;

        page.drawRectangle({
            x:MARGIN,
            y:y - 5,
            width:CONTENT_WIDTH,
            height:17,
            color:GRAY_BG
        });

        page.drawText(label,{
            x:MARGIN + 6,
            y,
            size:9,
            font:bold,
            color:BLACK
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
                    font,
                    color:rgb(1,1,1)
                });

            } else {

                page.drawRectangle({
                    x,
                    y:y - 4,
                    width,
                    height:15,
                    borderColor:GRAY_LINE,
                    borderWidth:0.8
                });

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
        value:boolean | null
    ){

        text(label);

        badges([
            {
                label:"Ja",
                active:value === true,
                color:GREEN
            },
            {
                label:"Nee",
                active:value === false,
                color:BLUE
            }
        ]);

        dashedLine();

    }




    function keuze(
        label:string,
        value:string,
        options:string[]
    ){

        text(label);

        badges(
            options.map(option=>({
                label:option,
                active:value === option,
                color:
                    option === "Nee" ||
                    option === "n.v.t."
                    ?
                    BLUE
                    :
                    GREEN
            }))
        );

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


    text("Projectgegevens:",{
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
        color:GRAY_BG
    });

    page.drawText(input.title,{
        x:MARGIN + 8,
        y,
        size:12,
        font:bold,
        color:BLACK
    });

    y -= 34;


    labelValue(
        "Projectnaam:",
        input.projectName
    );

    labelValue(
        "Adres:",
        input.customerAddress ?? "-"
    );

    labelValue(
        "Datum:",
        dateText
    );


    y -= 6;


    // monteurs naast elkaar

    ensure(34);

    const engineerColumn =
        CONTENT_WIDTH / 4;


    for(let index = 0; index < 4; index++){

        const x =
            MARGIN + index * engineerColumn;

        page.drawText(`Monteur ${index + 1}:`,{
            x,
            y,
            size:9,
            font,
            color:GRAY_TEXT
        });

        const name =
            input.engineers[index];

        if(name){

            page.drawText(name,{
                x,
                y:y - 13,
                size:9,
                font,
                color:BLACK
            });

        }

    }

    y -= 34;




    // ================= Installatiegegevens =================

    sectionBar("Installatiegegevens:");


    text("1. Tarief & Uren",{ useBold:true, gap:2 });


    jaNee(
        "Voorrijtarief?",
        data.tarief.voorrijtarief
    );


    labelValue(
        "Aantal gereden kilometers:",
        data.tarief.kilometers
    );

    labelValue(
        "Reisuren:",
        data.tarief.reisuren
    );

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


    text("2. Installatie werkzaamheden",{ useBold:true, gap:2 });


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


    text("3. Videowall",{ useBold:true, gap:2 });

    if(data.installatie.videowall){
        text(data.installatie.videowall ? "Ja" : "Nee",{ gap:2 });
    }

    dashedLine();


    text("4. Kiosk",{ useBold:true, gap:2 });

    if(data.installatie.kiosk){
        text(data.installatie.kiosk ? "Ja" : "Nee",{ gap:2 });
    }

    dashedLine();


    text("5. Mediaplayers",{ useBold:true, gap:2 });

    if(data.installatie.mediaplayers){

        keuze(
            "Heb je mediaplayers;",
            data.installatie.mediaplayers,
            ["Geïnstalleerd","Gedemonteerd"]
        );

        labelValue(
            "Aantal:",
            data.installatie.aantalMediaplayers
        );

    } else {

        dashedLine();

    }


    text("6. Audio",{ useBold:true, gap:2 });

    if(data.installatie.audio){
        text(data.installatie.audio ? "Ja" : "Nee",{ gap:2 });
    }

    dashedLine();


    jaNee(
        "7. Project (offerte basis) — is het een project?",
        data.installatie.isProject
    );


    labelValue(
        "Opmerkingen:",
        data.installatie.opmerkingen
    );




    // ================= Gebruikte materialen =================

    sectionBar("Gebruikte materialen:");


    jaNee(
        "1. Heb je nieuwe TV beugels gemonteerd?",
        data.materialen.nieuweBeugels
    );

    jaNee(
        "Heb je bestaande TV beugels gemonteerd?",
        data.materialen.bestaandeBeugels
    );


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

    if(beugelText){

        text(beugelText,{ gap:2 });

        dashedLine();

    }


    jaNee(
        "2. Heb je extra HDMI kabels gebruikt?",
        data.materialen.extraHdmiKabels
    );

    jaNee(
        "Heb je extra HDMI splitters gebruikt?",
        data.materialen.extraHdmiSplitters
    );

    jaNee(
        "3. Heb je extra patchkabels gebruikt?",
        data.materialen.extraPatchkabels
    );


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

    if(patchText){

        text(patchText,{ gap:2 });

        dashedLine();

    }


    jaNee(
        "Heb je extra switches gebruikt?",
        data.materialen.extraSwitches
    );

    jaNee(
        "4. Heb je extra UTP kabel getrokken?",
        data.materialen.utpGetrokken
    );

    jaNee(
        "5. Heb je extra stroomkabel getrokken?",
        data.materialen.stroomkabelGetrokken
    );

    jaNee(
        "6. Heb je verlengsnoeren (stekkerdozen) gebruikt?",
        data.materialen.verlengsnoeren
    );


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

    if(verlengText){

        text(verlengText,{ gap:2 });

        dashedLine();

    }


    jaNee(
        "7. Heb je extra seriële en/of USB speakers gebruikt?",
        data.materialen.extraSpeakers
    );

    labelValue(
        "Opmerkingen:",
        data.materialen.opmerkingen
    );


    // vrije materiaalregels uit de werkbon

    if(input.materials.length > 0){

        text("Overige materialen (werkbon):",{ useBold:true, gap:2 });

        for(const material of input.materials){

            text(
                `${material.quantity} ${material.unit ?? "x"}  ${material.name}`,
                { gap:1 }
            );

        }

        dashedLine();

    }




    // ================= Checklist =================

    sectionBar("Checklist:");


    jaNee(
        "1. Is de installatie werkend opgeleverd?",
        data.checklist.werkendOpgeleverd
    );

    jaNee(
        "2. Is de hardware aangesloten op een schakelstroompunt dat handmatig uit te zetten is?",
        data.checklist.lichtnetSchakelbaar
    );

    jaNee(
        "3. WiFi verbinding van toepassing?",
        data.checklist.wifiVanToepassing
    );

    if(data.checklist.wifiVanToepassing === true){

        keuze(
            "Is de WiFi verbinding sterk genoeg?",
            data.checklist.wifiSterkte,
            ["Ja","Matig","Slecht"]
        );

    }

    keuze(
        "4. Zijn de schermen gekoppeld aan Remote Services?",
        data.checklist.remoteServices,
        ["Ja","Nee","n.v.t."]
    );

    keuze(
        "5. Wat is de locatie van de mediaplayer(s)?",
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
        "6. Afvalverwijdering?",
        data.checklist.afvalverwijdering
    );




    // ================= Foto's =================

    if(input.photoUrls.length > 0){

        sectionBar("Foto's:");


        const photoWidth =
            (CONTENT_WIDTH - 20) / 2;

        let column = 0;

        let rowHeight = 0;


        for(const url of input.photoUrls){


            let image:PDFImage | null = null;


            try {

                const response =
                    await fetch(url);

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


            if(column === 0){

                ensure(height + 12);

                rowHeight = height;

            } else {

                // tweede kolom kan lager zijn; hoogste telt
                rowHeight =
                    Math.max(rowHeight,height);

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




    // ================= Handtekening =================

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

    y -= 14;


    page.drawRectangle({
        x:MARGIN,
        y:y - 110,
        width:200,
        height:110,
        borderColor:GRAY_LINE,
        borderWidth:0.8
    });


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




    // ================= Voetregel op elke pagina =================

    const pages =
        pdf.getPages();


    pages.forEach((current,index)=>{


        current.drawLine({
            start:{ x:MARGIN, y:45 },
            end:{ x:PAGE_WIDTH - MARGIN, y:45 },
            thickness:1,
            color:TEAL
        });


        if(logo){

            const scale =
                26 / logo.height;

            current.drawImage(logo,{
                x:MARGIN,
                y:12,
                width:logo.width * scale,
                height:26
            });

        }


        current.drawText("MDB Networks",{
            x:MARGIN + 34,
            y:24,
            size:10,
            font:bold,
            color:BLACK
        });


        current.drawText(
            "Data- Telecom- en Narrowcasting Installaties",
            {
                x:MARGIN + 34,
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
