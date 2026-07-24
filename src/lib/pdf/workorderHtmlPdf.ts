import puppeteer from "puppeteer";

import QRCode from "qrcode";

import {
    OpleverData,
    mergeOpleverData
} from "@/types/oplever";



// ---------- formatters (nl-NL) ----------

function formatDate(
    date:Date | null | undefined
):string {

    if(!date) return "—";

    return date.toLocaleDateString("nl-NL",{
        day:"2-digit",
        month:"2-digit",
        year:"numeric"
    });

}


function formatDateTime(
    date:Date | null | undefined
):string {

    if(!date) return "—";

    return `${formatDate(date)} ${date.toLocaleTimeString("nl-NL",{
        hour:"2-digit",
        minute:"2-digit"
    })}`;

}


function formatNumber(
    value:number | null | undefined,
    decimals = 0
):string {

    if(
        value === null ||
        value === undefined
    ){
        return "—";
    }

    return new Intl.NumberFormat("nl-NL",{
        minimumFractionDigits:decimals,
        maximumFractionDigits:decimals
    }).format(value);

}


function esc(
    value:string | null | undefined
):string {

    return (value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;");

}




export interface WorkorderHtmlPdfInput {

    number:string;

    title:string;

    status:string;

    description:string | null;

    plannedDate:Date | null;

    workDate:Date | null;

    createdAt:Date;

    projectName:string;

    customer:{
        name:string;
        address:string | null;
        phone:string | null;
        email:string | null;
    };

    engineerName:string | null;

    hours:{
        date:Date | null;
        hours:number;
        travelTime:number;
        kilometers:number;
        hotel:boolean;
    }[];

    hardware:{
        name:string;
        brand:string | null;
        model:string | null;
        serialNumber:string | null;
        quantity:number;
        location:string | null;
        status:string;
    }[];

    materials:{
        name:string;
        articleNumber:string | null;
        quantity:number;
        unit:string | null;
    }[];

    photoUrls:string[];

    signatureUrl:string | null;

    signedBy:string | null;

    formData:unknown;

}




// ---------- oplever-bouwstenen ----------

function pill(
    value:boolean | null
):string {

    if(value === true){
        return `<span class="pill pill-yes">Ja</span>`;
    }

    if(value === false){
        return `<span class="pill pill-no">Nee</span>`;
    }

    return `<span class="pill pill-empty">—</span>`;

}


function choicePill(
    value:string
):string {

    if(!value){
        return `<span class="pill pill-empty">—</span>`;
    }

    const negative =
        value === "Nee" ||
        value === "n.v.t." ||
        value === "Slecht";

    return `<span class="pill ${negative ? "pill-no" : "pill-yes"}">${esc(value)}</span>`;

}


function row(
    label:string,
    answer:string
):string {

    return `<tr>
        <td class="q">${esc(label)}</td>
        <td class="a">${answer}</td>
    </tr>`;

}


function textAnswer(
    value:string
):string {

    return value
    ?
    `<span class="txt">${esc(value)}</span>`
    :
    `<span class="pill pill-empty">—</span>`;

}




function opleverSections(
    data:OpleverData
):string {

    const t = data.tarief;

    const i = data.installatie;

    const m = data.materialen;

    const c = data.checklist;


    const beugels =
        [
            ["Muurbeugel",m.muurbeugel],
            ["Zwenkbeugel",m.zwenkbeugel],
            ["Plafond 150cm",m.plafond150],
            ["Plafond 300cm",m.plafond300],
            ["Vloerstandaard",m.vloerstandaard],
            ["Overig",m.overigBeugel]
        ]
        .filter(([,amount])=>amount)
        .map(([name,amount])=>`${name}: ${amount}`)
        .join(" · ");


    const patch =
        [
            ["1 m",m.patch1],
            ["2 m",m.patch2],
            ["3 m",m.patch3],
            ["5 m",m.patch5],
            ["7,5 m",m.patch75],
            ["10 m",m.patch10]
        ]
        .filter(([,amount])=>amount)
        .map(([name,amount])=>`${name}: ${amount}`)
        .join(" · ");


    const verleng =
        [
            ["1,5 m",m.verleng15],
            ["3 m",m.verleng3],
            ["5 m",m.verleng5]
        ]
        .filter(([,amount])=>amount)
        .map(([name,amount])=>`3-voudig ${name}: ${amount}`)
        .join(" · ");


    return `
  <div class="section">
    <div class="section-title">Installatiegegevens</div>
    <table class="qa">
      ${row("Voorrijtarief?",pill(t.voorrijtarief))}
      ${t.kilometers ? row("Aantal gereden kilometers",textAnswer(t.kilometers)) : ""}
      ${t.reisuren ? row("Reisuren",textAnswer(t.reisuren)) : ""}
      ${t.parkeerkosten ? row("Parkeerkosten",textAnswer(t.parkeerkosten)) : ""}
      ${t.materiaalkosten ? row("Materiaalkosten",textAnswer(t.materiaalkosten)) : ""}
      ${t.hotelSejour ? row("Hotel / sejour",textAnswer(t.hotelSejour)) : ""}
      ${row("Nieuwe schermen geïnstalleerd?",pill(i.nieuweSchermen))}
      ${row("Hergebruikte schermen geïnstalleerd?",pill(i.hergebruikteSchermen))}
      ${i.schermFormaat ? row("Formaat scherm",textAnswer(i.schermFormaat)) : ""}
      ${i.aantalSchermen ? row("Aantal schermen van dit formaat",textAnswer(i.aantalSchermen)) : ""}
      ${row("Tilhulp gehad?",pill(i.tilhulp))}
      ${i.orientatie ? row("Oriëntatie",choicePill(i.orientatie)) : ""}
      ${i.typeBeugel ? row("Type beugel",textAnswer(i.typeBeugel)) : ""}
      ${i.aantalIngesteld ? row("Aantal schermen ingesteld",textAnswer(i.aantalIngesteld)) : ""}
      ${i.videowall ? row("Videowall",textAnswer(i.videowall)) : ""}
      ${i.kiosk ? row("Kiosk",textAnswer(i.kiosk)) : ""}
      ${i.mediaplayers ? row("Mediaplayers",choicePill(i.mediaplayers)) : ""}
      ${i.aantalMediaplayers ? row("Aantal mediaplayers",textAnswer(i.aantalMediaplayers)) : ""}
      ${i.audio ? row("Audio",textAnswer(i.audio)) : ""}
      ${row("Project (offertebasis)?",pill(i.isProject))}
    </table>
    ${i.opmerkingen ? `<div class="description-box" style="margin-top:6px">${esc(i.opmerkingen)}</div>` : ""}
  </div>

  <div class="section">
    <div class="section-title">Gebruikte materialen</div>
    <table class="qa">
      ${row("Nieuwe TV beugels gemonteerd?",pill(m.nieuweBeugels))}
      ${row("Bestaande TV beugels gemonteerd?",pill(m.bestaandeBeugels))}
      ${beugels ? row("Beugels",textAnswer(beugels)) : ""}
      ${row("Extra HDMI kabels gebruikt?",pill(m.extraHdmiKabels))}
      ${row("Extra HDMI splitters gebruikt?",pill(m.extraHdmiSplitters))}
      ${row("Extra patchkabels gebruikt?",pill(m.extraPatchkabels))}
      ${patch ? row("Patchkabels",textAnswer(patch)) : ""}
      ${row("Extra switches gebruikt?",pill(m.extraSwitches))}
      ${row("Extra UTP kabel getrokken?",pill(m.utpGetrokken))}
      ${row("Extra stroomkabel getrokken?",pill(m.stroomkabelGetrokken))}
      ${row("Verlengsnoeren (stekkerdozen) gebruikt?",pill(m.verlengsnoeren))}
      ${verleng ? row("Verlengsnoeren",textAnswer(verleng)) : ""}
      ${row("Extra seriële en/of USB speakers gebruikt?",pill(m.extraSpeakers))}
    </table>
    ${m.opmerkingen ? `<div class="description-box" style="margin-top:6px">${esc(m.opmerkingen)}</div>` : ""}
  </div>

  <div class="section">
    <div class="section-title">Checklist</div>
    <table class="qa">
      ${row("Installatie werkend opgeleverd?",pill(c.werkendOpgeleverd))}
      ${row("Hardware op handmatig schakelbaar stroompunt?",pill(c.lichtnetSchakelbaar))}
      ${row("WiFi verbinding van toepassing?",pill(c.wifiVanToepassing))}
      ${c.wifiVanToepassing === true ? row("WiFi verbinding sterk genoeg?",choicePill(c.wifiSterkte)) : ""}
      ${row("Schermen gekoppeld aan Remote Services?",choicePill(c.remoteServices))}
      ${row("Locatie mediaplayer(s)",c.locatieMediaplayer ? choicePill(c.locatieMediaplayer) : `<span class="pill pill-empty">—</span>`)}
      ${c.aantalMediaplayers ? row("Aantal mediaplayers",textAnswer(c.aantalMediaplayers)) : ""}
      ${row("Afvalverwijdering?",pill(c.afvalverwijdering))}
    </table>
  </div>`;

}




function generateHtml(
    data:WorkorderHtmlPdfInput,
    qrDataUrl:string
):string {


    const oplever =
        mergeOpleverData(
            data.formData
        );


    const totalHours =
        data.hours.reduce(
            (sum,item)=>sum + Number(item.hours),
            0
        );

    const totalTravel =
        data.hours.reduce(
            (sum,item)=>sum + Number(item.travelTime),
            0
        );

    const totalKm =
        data.hours.reduce(
            (sum,item)=>sum + Number(item.kilometers),
            0
        );


    const statusLabels:Record<string,string> = {
        open:"Open",
        in_uitvoering:"In uitvoering",
        afgerond:"Afgerond"
    };


    return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10px;
    color: #1e293b;
    line-height: 1.4;
    background: #fff;
  }
  .page { width: 210mm; padding: 16mm 14mm; }
  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2.5px solid #1a4fff; margin-bottom: 16px; }
  .logo-block { display: flex; align-items: center; gap: 10px; }
  .logo-box { width: 36px; height: 36px; background: #1a4fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .logo-text { color: #fff; font-weight: 800; font-size: 16px; }
  .company-name { font-weight: 700; font-size: 14px; color: #0f172a; }
  .company-sub { font-size: 9px; color: #64748b; }
  .order-number { text-align: right; }
  .order-number-value { font-size: 18px; font-weight: 800; color: #1a4fff; letter-spacing: -0.5px; }
  .order-meta { font-size: 9px; color: #64748b; margin-top: 2px; }
  .status-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 600; background: #dce6ff; color: #1a4fff; }
  /* Sections */
  .section { margin-bottom: 14px; page-break-inside: avoid; }
  .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
  .info-label { font-size: 8px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-value { font-size: 10px; color: #1e293b; margin-top: 2px; font-weight: 500; }
  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 9px; }
  thead tr { background: #1e2a5e; color: #fff; }
  thead th { padding: 6px 8px; text-align: left; font-weight: 600; letter-spacing: 0.3px; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
  tfoot tr { background: #1e2a5e; color: #fff; }
  tfoot td { padding: 6px 8px; font-weight: 700; }
  /* Vraag/antwoord */
  .qa td { padding: 4px 8px; border-bottom: 1px solid #eef2f7; }
  .qa .q { color: #334155; width: 62%; }
  .qa .a { text-align: right; }
  .txt { font-weight: 600; color: #1e293b; }
  .pill { display: inline-block; padding: 1px 10px; border-radius: 999px; font-size: 8.5px; font-weight: 600; }
  .pill-yes { background: #dcf5e4; color: #15803d; }
  .pill-no { background: #ddf1fd; color: #0369a1; }
  .pill-empty { background: #f1f5f9; color: #94a3b8; }
  /* Beschrijving / meerwerk */
  .description-box { background: #f8fafc; border-left: 3px solid #1a4fff; padding: 8px 10px; border-radius: 0 4px 4px 0; font-size: 9px; color: #334155; line-height: 1.5; }
  /* Foto's */
  .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .photo-grid img { width: 100%; max-height: 220px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; }
  /* Handtekeningen */
  .sig-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; min-height: 70px; }
  .sig-img { max-height: 60px; max-width: 100%; }
  .sig-line { border-top: 1px dashed #cbd5e1; margin-top: 40px; padding-top: 4px; font-size: 8px; color: #94a3b8; }
  /* Footer */
  .footer { margin-top: 18px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-meta { font-size: 8px; color: #94a3b8; line-height: 1.8; }
  .qr-img { width: 56px; height: 56px; }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="logo-block">
      <div class="logo-box"><span class="logo-text">M</span></div>
      <div>
        <div class="company-name">MDB Networks B.V.</div>
        <div class="company-sub">Data- Telecom- en Narrowcasting Installaties</div>
      </div>
    </div>
    <div class="order-number">
      <div class="order-number-value">${esc(data.number)}</div>
      <div class="order-meta">Werkbon · ${formatDate(data.createdAt)}</div>
      <div style="margin-top:4px"><span class="status-badge">${esc(statusLabels[data.status] ?? data.status)}</span></div>
    </div>
  </div>

  <!-- PROJECT + KLANT -->
  <div class="section">
    <div class="section-title">Projectinformatie</div>
    <div class="grid-2" style="gap:10px">
      <div class="info-box">
        <div class="info-label">Werkbon</div>
        <div class="info-value" style="font-size:12px;font-weight:700">${esc(data.title)}</div>
        <div class="info-value" style="font-size:9px;color:#64748b;margin-top:2px">${esc(data.projectName)}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Klant</div>
        <div class="info-value" style="font-size:11px;font-weight:700">${esc(data.customer.name)}</div>
        ${data.customer.address ? `<div class="info-value" style="font-size:9px;color:#64748b">${esc(data.customer.address)}</div>` : ""}
        ${data.customer.phone ? `<div class="info-value" style="font-size:9px;color:#64748b">${esc(data.customer.phone)}</div>` : ""}
      </div>
    </div>
  </div>

  <!-- META -->
  <div class="section">
    <div class="grid-3">
      <div class="info-box">
        <div class="info-label">Monteur</div>
        <div class="info-value">${esc(data.engineerName ?? "—")}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Geplande datum</div>
        <div class="info-value">${formatDate(data.plannedDate)}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Uitgevoerd op</div>
        <div class="info-value">${formatDate(data.workDate)}</div>
      </div>
    </div>
  </div>

  <!-- OMSCHRIJVING -->
  ${data.description ? `
  <div class="section">
    <div class="section-title">Omschrijving werkzaamheden</div>
    <div class="description-box">${esc(data.description)}</div>
  </div>` : ""}

  <!-- UREN -->
  ${data.hours.length > 0 ? `
  <div class="section">
    <div class="section-title">Uren &amp; reiskosten</div>
    <table>
      <thead><tr>
        <th>Datum</th><th>Uren</th><th>Reistijd (u)</th><th>KM</th><th>Hotel</th>
      </tr></thead>
      <tbody>
        ${data.hours.map(item=>`<tr>
          <td>${formatDate(item.date)}</td>
          <td>${formatNumber(Number(item.hours),1)}</td>
          <td>${formatNumber(Number(item.travelTime),1)}</td>
          <td>${formatNumber(Number(item.kilometers),0)}</td>
          <td>${item.hotel ? "✓" : "—"}</td>
        </tr>`).join("")}
      </tbody>
      <tfoot><tr>
        <td>Totaal</td>
        <td>${formatNumber(totalHours,1)}</td>
        <td>${formatNumber(totalTravel,1)}</td>
        <td>${formatNumber(totalKm,0)}</td>
        <td></td>
      </tr></tfoot>
    </table>
  </div>` : ""}

  <!-- HARDWARE -->
  ${data.hardware.length > 0 ? `
  <div class="section">
    <div class="section-title">Hardware</div>
    <table>
      <thead><tr>
        <th>Naam</th><th>Merk</th><th>Model</th><th>Serienummer</th><th>Aantal</th><th>Locatie</th>
      </tr></thead>
      <tbody>
        ${data.hardware.map(item=>`<tr>
          <td>${esc(item.name)}</td>
          <td>${esc(item.brand) || "—"}</td>
          <td>${esc(item.model) || "—"}</td>
          <td style="font-family:monospace">${esc(item.serialNumber) || "—"}</td>
          <td>${item.quantity}</td>
          <td>${esc(item.location) || "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <!-- MATERIALEN -->
  ${data.materials.length > 0 ? `
  <div class="section">
    <div class="section-title">Materialen</div>
    <table>
      <thead><tr><th>Materiaal</th><th>Artikelnummer</th><th>Aantal</th><th>Eenheid</th></tr></thead>
      <tbody>
        ${data.materials.map(item=>`<tr>
          <td>${esc(item.name)}</td>
          <td style="font-family:monospace">${esc(item.articleNumber) || "—"}</td>
          <td>${formatNumber(Number(item.quantity),2)}</td>
          <td>${esc(item.unit) || "st"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <!-- OPLEVERFORMULIER -->
  ${opleverSections(oplever)}

  <!-- FOTO'S -->
  ${data.photoUrls.length > 0 ? `
  <div class="section">
    <div class="section-title">Foto's</div>
    <div class="photo-grid">
      ${data.photoUrls.map(url=>`<img src="${esc(url)}" alt="Foto" />`).join("")}
    </div>
  </div>` : ""}

  <!-- HANDTEKENINGEN -->
  <div class="section">
    <div class="section-title">Handtekeningen</div>
    <div class="grid-2">
      <div>
        <div class="info-label" style="margin-bottom:4px">Handtekening klant</div>
        <div class="sig-box">
          ${data.signatureUrl ? `<img src="${esc(data.signatureUrl)}" class="sig-img" alt="Handtekening klant" />` : ""}
          <div class="sig-line">Naam: ${esc(data.signedBy) || "_________________________________"}</div>
        </div>
      </div>
      <div>
        <div class="info-label" style="margin-bottom:4px">Handtekening monteur</div>
        <div class="sig-box">
          <div class="sig-line">${esc(data.engineerName) || ""}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-meta">
      <div style="font-weight:700;color:#1e293b;margin-bottom:2px">MDB Networks B.V.</div>
      <div>Werkbon: ${esc(data.number)}</div>
      <div>Gegenereerd: ${formatDateTime(new Date())}</div>
      <div style="margin-top:4px;color:#cbd5e1">Dit is een automatisch gegenereerd document</div>
    </div>
    <img src="${qrDataUrl}" class="qr-img" alt="QR Code" />
  </div>

</div>
</body>
</html>`;

}




export async function generateWorkorderHtmlPdf(
    data:WorkorderHtmlPdfInput,
    appUrl:string
):Promise<Buffer> {


    const qrDataUrl =
        await QRCode.toDataURL(
            `${appUrl}/workorders/${data.number}`,
            {
                width:120,
                margin:1,
                color:{
                    dark:"#1e2a5e",
                    light:"#ffffff"
                }
            }
        );


    const html =
        generateHtml(
            data,
            qrDataUrl
        );


    const browser =
        await puppeteer.launch({
            headless:true,
            args:[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ],
            executablePath:
                process.env.PUPPETEER_EXECUTABLE_PATH
        });


    try {

        const page =
            await browser.newPage();

        await page.setContent(html,{
            waitUntil:"networkidle0"
        });

        const pdf =
            await page.pdf({
                format:"A4",
                margin:{
                    top:"0",
                    right:"0",
                    bottom:"0",
                    left:"0"
                },
                printBackground:true
            });

        return Buffer.from(pdf);

    } finally {

        await browser.close();

    }

}
