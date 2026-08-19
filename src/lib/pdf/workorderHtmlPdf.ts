import { launchBrowserForPdf } from "@/lib/pdf/launchBrowserForPdf";
import { generateOpleverPdf } from "@/lib/pdf/opleverPdf";
import { mdbLogoDataUrl } from "@/lib/pdf/mdbBrand";


import {
    ExtraKosten,
    MateriaalStuk,
    OpleverData,
    SchermBlok,
    mergeOpleverData
} from "@/types/oplever";
import {
    summarizeVoorziening,
    werkzaamheidLabel,
    beugelLabel,
    schermHeeftGegevens,
} from "@/types/installatieRuimtes";



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


function extraDienstRegel(
    aan:boolean | undefined,
    label:string,
    aantal:string | undefined
):string {

    if(!aan){
        return "";
    }

    const n = (aantal || "").trim();

    return n ? `${label} (${n})` : label;

}


function formatMateriaalStukken(
    amount:string,
    items:MateriaalStuk[] | undefined,
    sns:unknown
):string {

    const snArr = Array.isArray(sns)
        ? sns.map((s)=>typeof s === "string" ? s : "")
        : [];

    const rows =
        Array.isArray(items) && items.length > 0
        ? items
        : snArr.map((sn)=>({ merk:"", type:"", sn }));

    const details = rows
        .map((row, i)=>{
            const sn = (row.sn || snArr[i] || "").trim();
            return [
                row.merk?.trim(),
                row.type?.trim(),
                sn ? `S/N ${i + 1}: ${sn}` : ""
            ].filter(Boolean).join(" · ");
        })
        .filter(Boolean);

    return details.length ? `${amount} (${details.join("; ")})` : amount;

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

    photos:{ url:string; caption:string | null }[];

    signatureUrl:string | null;

    signedBy:string | null;

    formData:unknown;

    // Per-opdrachtgever schema (voor de labels van de extra velden)
    customerSchema?:unknown;

}




// ---------- oplever-bouwstenen ----------

function chipSvg(
    label:string,
    kind:"yes" | "no" | "empty"
):string {

    const fill =
        kind === "yes"
        ? "#dcf5e4"
        : kind === "no"
        ? "#ddf1fd"
        : "#f1f5f9";
    const color =
        kind === "yes"
        ? "#15803d"
        : kind === "no"
        ? "#0369a1"
        : "#94a3b8";
    const width = Math.max(32, Math.round(label.length * 5.6 + 18));
    const height = 16;
    const r = 8;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display:inline-block;vertical-align:middle">
        <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${r}" ry="${r}" fill="${fill}"/>
        <text x="${width / 2}" y="${height / 2 + 3.4}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="8" font-weight="700" fill="${color}">${esc(label)}</text>
    </svg>`;

}


function pill(
    value:boolean | null
):string {

    if(value === true){
        return chipSvg("Ja","yes");
    }

    if(value === false){
        return chipSvg("Nee","no");
    }

    return chipSvg("—","empty");

}


function choicePill(
    value:string
):string {

    if(!value){
        return chipSvg("—","empty");
    }

    const negative =
        value === "Nee" ||
        value === "n.v.t." ||
        value === "Slecht";

    return chipSvg(value, negative ? "no" : "yes");

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


function qaBlock(
    title:string,
    rowsHtml:string
):string {

    if(!rowsHtml.includes("<tr>")){
        return "";
    }

    return `
  <div class="section">
    <div class="section-title">${title}</div>
    <table class="qa">
      ${rowsHtml}
    </table>
  </div>`;

}


function textAnswer(
    value:string
):string {

    return value
    ?
    `<span class="txt">${esc(value)}</span>`
    :
    chipSvg("—","empty");

}




function opleverSections(
    data:OpleverData,
    monteur1:string | null
):string {

    const t = data.tarief;

    const i = data.installatie;

    const m = data.materialen;

    const c = data.checklist;


    // ---- uren per monteur ----

    const monteurs:[string,string][] = [];

    if(t.urenMonteur1 || monteur1){
        monteurs.push([
            monteur1 ?? "Monteur 1",
            t.urenMonteur1
        ]);
    }

    if(t.monteur2){
        monteurs.push([t.monteur2,t.urenMonteur2]);
    }

    if(t.monteur3){
        monteurs.push([t.monteur3,t.urenMonteur3]);
    }

    if(t.monteur4){
        monteurs.push([t.monteur4,t.urenMonteur4]);
    }


    const urenRows =
        monteurs
        .filter(([,uren])=>uren)
        .map(([naam,uren])=>
            row(
                `Uren ${naam} (regiebasis)`,
                textAnswer(`${uren} uur`)
            )
        )
        .join("");


    // ---- extra kosten ----

    const kosten:[string,ExtraKosten][] = [
        ["Parkeerkosten",t.parkeerkosten],
        ["Materiaal",t.materiaalkosten],
        ["Sejour",t.sejour]
    ];

    const kostenRows =
        kosten
        .filter(([,blok])=>blok.actief)
        .map(([label,blok])=>
            row(
                `${label}${blok.voorgeschoten === true ? " (voorgeschoten)" : ""}`,
                textAnswer(blok.kosten ? `€ ${blok.kosten}` : "—")
            )
        )
        .join("");


    // ---- schermblokken ----

    function schermBlokken(
        titel:string,
        blokken:SchermBlok[]
    ):string {

        return blokken
        .filter(blok=>
            blok.status ||
            blok.formaat ||
            blok.aantal
        )
        .map((blok,index)=>{

            const parts:string[] = [];

            const formaatWaarde =
                blok.formaat === "Anders"
                ?
                (blok.formaatAnders || "Anders")
                :
                blok.formaat;

            const beugelWaarde =
                blok.typeBeugel === "Anders"
                ?
                (blok.beugelAnders || "Anders")
                :
                blok.typeBeugel;

            if(blok.status) parts.push(`Status: ${blok.status}`);

            if(formaatWaarde) parts.push(`Formaat: ${formaatWaarde}`);

            if(blok.aantal) parts.push(`Aantal: ${blok.aantal}`);

            if(blok.orientatie) parts.push(`Oriëntatie: ${blok.orientatie}`);

            if(beugelWaarde) parts.push(`Beugel: ${beugelWaarde}`);

            if(blok.tilhulp !== null) parts.push(`Tilhulp: ${blok.tilhulp ? "Ja" : "Nee"}`);

            if(blok.bekabeling) parts.push(`Bekabeling: ${blok.bekabeling}`);

            if(blok.aantalIngesteld) parts.push(`Ingesteld: ${blok.aantalIngesteld}`);

            return row(
                `${titel} ${index + 1}`,
                textAnswer(parts.join(" · "))
            );

        })
        .join("");

    }


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


    const hdmiKabels =
        [
            ["1 m",m.hdmi1m],
            ["2 m",m.hdmi2m],
            ["3 m",m.hdmi3m],
            ["5 m",m.hdmi5m],
            ["7,5 m",m.hdmi75m],
            ["10 m",m.hdmi10m]
        ]
        .filter(([,amount])=>amount)
        .map(([name,amount])=>`${name}: ${amount}`)
        .join(" · ");


    const hdmiSplitters =
        (
            [
                ["1x2", m.hdmiSplitter1x2, m.hdmiSplitter1x2Items, m.hdmiSplitter1x2Sn],
                ["1x4", m.hdmiSplitter1x4, m.hdmiSplitter1x4Items, m.hdmiSplitter1x4Sn]
            ] as [string, string, MateriaalStuk[] | undefined, string[] | undefined][]
        )
        .filter(([,amount])=>amount)
        .map(([name,amount,items,sns])=>
            `${name}: ${formatMateriaalStukken(amount, items, sns)}`
        )
        .join(" · ");


    const switches =
        (
            [
                ["5 poorten gigabit", m.switch5port, m.switch5portItems, m.switch5portSn],
                ["8 poorten gigabit", m.switch8port, m.switch8portItems, m.switch8portSn],
                ["5 poorten PoE gigabit", m.switch5portPoe, m.switch5portPoeItems, m.switch5portPoeSn]
            ] as [string, string, MateriaalStuk[] | undefined, string[] | undefined][]
        )
        .filter(([,amount])=>amount)
        .map(([name,amount,items,sns])=>
            `${name}: ${formatMateriaalStukken(amount, items, sns)}`
        )
        .join(" · ");


    const utp =
        [
            ["Type 2 (20 m)",m.utpType2],
            ["Type 3 (30 m)",m.utpType3],
            ["Type 4 (40 m)",m.utpType4],
            ["Type 5 (50 m)",m.utpType5],
            ["Type 6 (60 m)",m.utpType6],
            ["Type 7 (70 m)",m.utpType7]
        ]
        .filter(([,amount])=>amount)
        .map(([name,amount])=>`${name}: ${amount}`)
        .join(" · ");


    const stroom =
        [
            ["Type 1 (10 m)",m.stroomType1],
            ["Type 2 (20 m)",m.stroomType2],
            ["Type 3 (30 m)",m.stroomType3]
        ]
        .filter(([,amount])=>amount)
        .map(([name,amount])=>`${name}: ${amount}`)
        .join(" · ");


    const rs232 =
        [
            ["1 m",m.rs232_1m],
            ["5 m",m.rs232_5m],
            ["10 m",m.rs232_10m]
        ]
        .filter(([,amount])=>amount)
        .map(([name,amount])=>`${name}: ${amount}`)
        .join(" · ");


    const filledRuimtes =
        Array.isArray(i.ruimtes)
        ?
        i.ruimtes.filter((r)=>
            r.werkzaamheid
            ||
            (r.naam || "").trim()
            ||
            (r.schermen || []).some((s)=>schermHeeftGegevens(s))
        )
        :
        [];


    return `
  ${qaBlock("1. Tarief &amp; Uren", `
      ${t.voorrijtarief !== null ? row("Voorrijtarief?", t.voorrijtarief ? chipSvg("Vast","yes") : chipSvg("KM's + Uren","no")) : ""}
      ${t.voorrijtarief === false && t.kilometers ? row("Aantal gereden kilometers",textAnswer(t.kilometers)) : ""}
      ${t.voorrijtarief === false && t.reisuren ? row("Reisuren",textAnswer(t.reisuren)) : ""}
      ${urenRows}
      ${kostenRows}
  `)}

  ${qaBlock("2. Installatie werkzaamheden", `
      ${filledRuimtes.length > 0
        ? filledRuimtes.map((r, ri)=>{
            const naam = (r.naam || `Ruimte ${ri + 1}`).trim();
            const parts = [
              r.werkzaamheid ? werkzaamheidLabel(r.werkzaamheid) : "",
              r.beugelType ? `${beugelLabel(r.beugelType)}${r.beugelMaat ? ` (${r.beugelMaat})` : ""}` : "",
              r.actie,
              r.orientatie,
              r.aantalSchermen ? `${r.aantalSchermen} scherm(en)` : ""
            ].filter(Boolean);
            const schermen = (r.schermen || [])
              .filter((s)=>schermHeeftGegevens(s))
              .map((s, si)=>{
                const sParts = [
                  s.label || `Scherm ${si + 1}`,
                  s.formaat,
                  s.merkType,
                  s.serienummer ? `SN ${s.serienummer}` : "",
                  s.mac ? `MAC ${s.mac}` : ""
                ].filter(Boolean);
                return sParts.join(" · ");
              })
              .join("<br/>");
            return row(
              naam,
              (parts.join(" · ") ? textAnswer(parts.join(" · ")) : "") + (schermen ? `<div style="margin-top:4px;font-size:11px">${schermen}</div>` : "")
            );
          }).join("")
        : `
      ${i.nieuweSchermen === true ? row("1. Schermen",pill(i.nieuweSchermen)) : ""}
      ${i.nieuweSchermen === true ? schermBlokken("Scherm",i.nieuweFormaten) : ""}
      ${i.hergebruikteSchermen === true && i.hergebruikteFormaten.length > 0 ? schermBlokken("Scherm",i.hergebruikteFormaten) : ""}
      ${i.videowall === true ? row("2. Videowall",pill(i.videowall)) : ""}
      ${i.videowall === true ? (()=>{
        const v = { ...(i.videowallVelden || {}) };
        if(!v.configuratie && (i.videowallHorizontaal || i.videowallVerticaal)){
            v.configuratie = `${i.videowallHorizontaal || "?"} x ${i.videowallVerticaal || "?"}`;
        }
        if(!v.formaat && i.videowallFormaat){
            v.formaat = i.videowallFormaat === "Anders" ? (i.videowallFormaatAnders || "Anders") : i.videowallFormaat;
        }
        if(!v.orientatie && i.videowallOrientatie){
            v.orientatie = i.videowallOrientatie;
        }
        const typeLabel = v.type === "LED" ? "LED videowall" : v.type === "LCD" ? "LCD videowall" : "";
        const formaat = v.formaat === "Anders" ? (v.formaatAnders || "Anders") : v.formaat;
        return [
            typeLabel ? row("Type videowall", textAnswer(typeLabel)) : "",
            v.configuratie ? row("Configuratie", textAnswer(v.configuratie)) : "",
            v.afmeting ? row("Afmeting", textAnswer(v.afmeting)) : "",
            formaat ? row("Formaat", textAnswer(formaat)) : "",
            v.orientatie ? row("Oriëntatie", textAnswer(v.orientatie)) : "",
            (v.locatie || v.opmerking) ? row("Locatie", textAnswer(v.locatie || v.opmerking)) : "",
            v.stroom ? row("Stroom binnen 3 meter?", textAnswer(v.stroom)) : "",
            v.internet ? row("Internet binnen 3 meter?", textAnswer(v.internet)) : ""
        ].join("");
      })() : ""}
      ${i.kiosk === true ? row("3. Kiosk",pill(i.kiosk)) : ""}
      ${i.kiosk === true ? (i.kioskBlokken || []).filter(kb=>kb.status || kb.omschrijving || kb.aantal).map((kb,ki)=>
          row(`Kiosk ${ki + 1}`,textAnswer([kb.status, kb.omschrijving, kb.aantal ? `aantal: ${kb.aantal}` : ""].filter(Boolean).join(" · ")))
        ).join("") : ""}
      ${i.mediaplayers ? row("4. Mediaplayers",choicePill(i.mediaplayers)) : ""}
      ${i.mediaplayers && i.aantalMediaplayers ? row("Aantal mediaplayers",textAnswer(i.aantalMediaplayers)) : ""}
      ${i.audio === true ? row("5. Audio",pill(i.audio)) : ""}
      ${i.audio === true && i.audioStatus ? row("Audio status",textAnswer(i.audioStatus)) : ""}
      ${i.audio === true && i.audioSpeler ? row("Audiospeler",textAnswer(formatMateriaalStukken(i.audioSpeler, i.audioSpelerItems, []))) : ""}
      ${i.audio === true && i.audioVersterker ? row("Versterker",textAnswer(formatMateriaalStukken(i.audioVersterker, i.audioVersterkerItems, []))) : ""}
      ${i.audio === true && i.audioVolumeregelaar ? row("Volumeregelaar",textAnswer(formatMateriaalStukken(i.audioVolumeregelaar, i.audioVolumeregelaarItems, []))) : ""}
      ${i.audio === true && i.audioSpeakers ? row("Speakers (aantal)",textAnswer(i.audioSpeakers)) : ""}
      ${i.audio === true && i.audioAndersTekst ? row(i.audioAndersTekst + " (aantal)",textAnswer(i.audioAndersAantal || "—")) : ""}
      `}
      ${summarizeVoorziening("Stroom", i.stroomBlok) ? row("Stroom", textAnswer(summarizeVoorziening("Stroom", i.stroomBlok).replace(/^Stroom:\s*/,""))) : ""}
      ${summarizeVoorziening("Internet", i.internetBlok) ? row("Internet", textAnswer(summarizeVoorziening("Internet", i.internetBlok).replace(/^Internet:\s*/,""))) : ""}
      ${i.extra && (i.extra.afvoerTm50 || i.extra.afvoerVanaf50 || i.extra.afval || i.extra.audio)
        ? row("Extra diensten", textAnswer([
            extraDienstRegel(i.extra.afval, "Afval/verpakking", i.extra.afvalAantal),
            extraDienstRegel(i.extra.afvoerTm50, 'Afvoer t/m 50"', i.extra.afvoerTm50Aantal),
            extraDienstRegel(i.extra.afvoerVanaf50, 'Afvoer vanaf 50"', i.extra.afvoerVanaf50Aantal),
            i.extra.audio ? "Audio" : ""
          ].filter(Boolean).join(", ")))
        : ""}
      ${i.isProject !== null ? row("6. Project (offertebasis)?",pill(i.isProject)) : ""}
      ${i.isProject === true && i.projectNummer ? row("Projectnummer",textAnswer(i.projectNummer)) : ""}
  `)}
  ${i.opmerkingen ? `<div class="section"><div class="description-box">${esc(i.opmerkingen)}</div></div>` : ""}

  ${(()=>{
      const ev = data.evalue8 && typeof data.evalue8 === "object" ? data.evalue8 : {};
      const secties:{ titel:string; regels:{ key:string; naam:string }[] }[] = [
          { titel:"2. Werkplek (WKS)", regels:[
              { key:"wks_easy", naam:"WKS Easy" },
              { key:"wks_full", naam:"WKS Full" },
              { key:"wks_vervolg_kort", naam:"Vervolginstallatie (Kort)" },
              { key:"wks_vervolg_lang", naam:"Vervolginstallatie (Lang)" }
          ]},
          { titel:"3. Kiosk", regels:[
              { key:"kiosk_easy", naam:"Kiosk Easy" },
              { key:"kiosk_full", naam:"Kiosk Full" },
              { key:"kiosk_extended", naam:"Kiosk Extended" },
              { key:"kiosk_demontage", naam:"Demontage Kiosk" }
          ]},
          { titel:"4. Digital Signage (DS)", regels:[
              { key:"ds_extra_scherm", naam:"Extra scherm op locatie" },
              { key:"ds_player", naam:"Installatie DS Player" },
              { key:"ds_swap", naam:"Installatie DS Swap" }
          ]},
          { titel:"5. Service, Software & Storingen", regels:[
              { key:"balie_software", naam:"Installatie Balie software" },
              { key:"storing_type1", naam:"Storing Type 1" },
              { key:"storing_type2", naam:"Storing Type 2" }
          ]}
      ];

      const gekozenRegels = secties
          .map(sectie=>{
              const rijen = sectie.regels
                  .map(r=>{
                      const item = ev[r.key];
                      if(item && item.aan){
                          return row(r.naam, textAnswer(`Aantal: ${item.aantal || "1"}`));
                      }
                      return "";
                  })
                  .filter(Boolean)
                  .join("");
              if(!rijen){ return ""; }
              return `<tr><td colspan="2" style="padding-top:6px;font-weight:700;color:#0f172a">${esc(sectie.titel)}</td></tr>${rijen}`;
          })
          .filter(Boolean)
          .join("");

      const spare = data.evalue8SparePlayer;
      const spareRegels = [
          ["BTR 5", data.evalue8SpareBtr5],
          ["GD", data.evalue8SpareGd],
          ['Kiosk Tablet 15,6"', data.evalue8SpareKiosk156],
          ['Kiosk Tablet 21"', data.evalue8SpareKiosk21]
      ]
      .filter(([,a])=>a)
      .map(([naam,a])=>row(String(naam), textAnswer(`Aantal: ${a}`)))
      .join("");

      const spareBlok = spare === null ? "" : `
          <tr><td colspan="2" style="padding-top:6px;font-weight:700;color:#0f172a">6. Spare player</td></tr>
          ${row("Spare player geïnstalleerd?", pill(spare))}
          ${spare === true ? spareRegels : ""}
          ${spare === true ? row("Melding gemaakt bij eValue8?", pill(data.evalue8SpareMelding)) : ""}
      `;

      if(!gekozenRegels && !spareBlok){ return ""; }

      return `
        <div class="section">
          <div class="section-title">eValue8 — installatie</div>
          <table class="qa">
            ${gekozenRegels}
            ${spareBlok}
          </table>
        </div>`;
  })()}

  ${data.hardware.length > 0 ? `
  <div class="section">
    <div class="section-title">Hardware geïnstalleerd / gedemonteerd</div>
    <table class="hardware-table">
      <thead>
        <tr>
          <th>Geïnstalleerd / gedemonteerd</th>
          <th>Merk</th>
          <th>Type</th>
          <th>Serienummer</th>
          <th>MAC Address</th>
        </tr>
      </thead>
      <tbody>
        ${data.hardware.map(h=>`<tr>
          <td>${esc(h.actie) || "—"}</td>
          <td>${esc(h.merk) || "—"}</td>
          <td>${esc(h.type) || "—"}</td>
          <td>${esc(h.serienummer) || "—"}</td>
          <td>${esc(h.macAddress) || "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  ${
    (
        m.nieuweBeugels === true ||
        m.extraHdmiKabels === true ||
        m.extraPatchkabels === true ||
        m.extraSwitches === true ||
        m.utpGetrokken === true ||
        m.stroomkabelGetrokken === true ||
        m.verlengsnoeren === true ||
        m.extraSpeakers === true ||
        m.multicast === true ||
        (m.opmerkingen && String(m.opmerkingen).trim())
    )
    ? `
  <div class="section">
    <div class="section-title">Gebruikte materialen</div>
    <table class="qa">
      ${m.nieuweBeugels === true ? row("1. TV beugels gemonteerd",textAnswer(m.bestaandeBeugels === true ? "Bestaand" : "Nieuw")) : ""}
      ${m.nieuweBeugels === true && beugels ? row("Beugels",textAnswer(beugels)) : ""}
      ${m.extraHdmiKabels === true && hdmiKabels ? row("HDMI kabels/splitters",textAnswer(hdmiKabels)) : ""}
      ${m.extraHdmiKabels === true && hdmiSplitters ? row("HDMI splitters",textAnswer(hdmiSplitters)) : ""}
      ${m.extraPatchkabels === true && patch ? row("3. Patchkabels",textAnswer(patch)) : ""}
      ${m.extraSwitches === true && switches ? row("Switches",textAnswer(switches)) : ""}
      ${m.utpGetrokken === true && utp ? row("4. UTP-kabels",textAnswer(utp)) : ""}
      ${m.stroomkabelGetrokken === true && stroom ? row("5. Stroomkabels",textAnswer(stroom)) : ""}
      ${m.verlengsnoeren === true && verleng ? row("6. Verlengsnoeren",textAnswer(verleng)) : ""}
      ${m.extraSpeakers === true && m.usbSpeakers ? row("7. USB Speakers (aantal)",textAnswer(m.usbSpeakers)) : ""}
      ${m.extraSpeakers === true && rs232 ? row("RS232 kabel",textAnswer(rs232)) : ""}
      ${m.multicast === true && m.multicastZenders ? row("8. Multicast set — zenders",textAnswer(
          formatMateriaalStukken(
              m.multicastZenders,
              m.multicastZenderItems,
              m.multicastZenderSns?.length ? m.multicastZenderSns : (m.multicastZenderSn ? [m.multicastZenderSn] : [])
          )
      )) : ""}
      ${m.multicast === true && m.multicastOntvangers ? row("Ontvangers (aantal)",textAnswer(
          formatMateriaalStukken(
              m.multicastOntvangers,
              m.multicastOntvangerItems,
              m.multicastOntvangerSns?.length ? m.multicastOntvangerSns : (m.multicastOntvangerSn ? [m.multicastOntvangerSn] : [])
          )
      )) : ""}
    </table>
    ${m.opmerkingen ? `<div class="description-box" style="margin-top:6px">${esc(m.opmerkingen)}</div>` : ""}
  </div>` : ""}

  <div class="section">
    <div class="section-title">Checklist</div>
    <table class="qa">
      ${row("1. Is de installatie werkend opgeleverd?",pill(c.werkendOpgeleverd))}
      ${c.werkendOpgeleverd === false && c.redenWerkend ? row("Reden",textAnswer(c.redenWerkend)) : ""}
      ${row("2. Hardware op handmatig schakelbaar stroompunt?",pill(c.lichtnetSchakelbaar))}
      ${c.lichtnetSchakelbaar === true && c.redenLichtnet ? row("Reden",textAnswer(c.redenLichtnet)) : ""}
      ${row("3. WiFi verbinding van toepassing?",pill(c.wifiVanToepassing))}
      ${c.wifiVanToepassing === true ? row("WiFi verbinding sterk genoeg?",choicePill(c.wifiSterkte)) : ""}
      ${row("4. Schermen gekoppeld aan Remote Services?",choicePill(c.remoteServices))}
      ${c.remoteServices === "Nee" && c.redenRemote ? row("Reden",textAnswer(c.redenRemote)) : ""}
      ${(()=>{
        const loc = c.mediaplayerLocaties && typeof c.mediaplayerLocaties === "object" ? c.mediaplayerLocaties : {};
        const regels = Object.keys(loc)
            .map(k=>`${k}${loc[k] ? `: ${loc[k]}` : ""}`)
            .join(" · ");
        if(regels){
            return row("5. Locatie mediaplayer(s)",textAnswer(regels));
        }
        if(c.locatieMediaplayer){
            return row("5. Locatie mediaplayer(s)",textAnswer(c.locatieMediaplayer + (c.aantalMediaplayers ? `: ${c.aantalMediaplayers}` : "")));
        }
        return "";
      })()}
      ${row("6. Afvalverwijdering?",pill(c.afvalverwijdering))}
    </table>
  </div>`;

}




// Per-opdrachtgever extra velden voor in de PDF
function customFieldsSection(
    schemaRaw:unknown,
    custom:Record<string,unknown>
):string {

    if(
        !schemaRaw ||
        typeof schemaRaw !== "object" ||
        !Array.isArray((schemaRaw as { sections?:unknown }).sections)
    ){
        return "";
    }

        const sections =
        (schemaRaw as { sections:Array<{
            id:string;
            title:string;
            fields:Array<{ id:string; label:string; type:string; required?:boolean }>;
        }> }).sections;


    const blocks =
        sections.map(section=>{

            const rows =
                section.fields.map(field=>{

                    const raw = custom[field.id];
                    const required = Boolean(field.required);

                    if(field.type === "checkbox"){
                        const checked = Boolean(raw);
                        if(!required && !checked){
                            return "";
                        }
                        return row(field.label, chipSvg(checked ? "Ja" : "Nee", checked ? "yes" : "no"));
                    }

                    const empty =
                        raw === undefined || raw === null || String(raw).trim() === "";

                    if(empty && !required){
                        return "";
                    }

                    return row(
                        field.label,
                        empty ? chipSvg("—","empty") : textAnswer(String(raw))
                    );

                }).join("");

            if(!rows.includes("<tr>")){
                return "";
            }

            return `
              <div class="section-title">${esc(section.title)}</div>
              <table class="qa">
                ${rows}
              </table>`;

        }).filter(Boolean).join("");

    if(!blocks){
        return "";
    }


    return `
  <div class="section">
    <div class="section-title">Opdrachtgever-specifieke gegevens</div>
    ${blocks}
  </div>`;

}




function generateHtml(
    data:WorkorderHtmlPdfInput,
    logoDataUrl:string = ""
):string {


    const oplever =
        mergeOpleverData(
            data.formData
        );


    // Veilig uitlezen; oudere opleverdata heeft dit veld mogelijk niet.
    const opdrachtgever =
        (oplever as { opdrachtgever?:string }).opdrachtgever ?? "";


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


    return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10px;
    color: #1f2937;
    line-height: 1.45;
    background: #fff;
  }
  .page { width: 210mm; padding: 15mm 14mm; }
  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    margin-bottom: 18px;
    border-bottom: 4px solid #0066ff;
  }
  .logo-block { display: flex; align-items: center; gap: 12px; }
  .mdb-logo { height: 46px; width: auto; object-fit: contain; }
  .logo-box { width: 40px; height: 40px; background: #0066ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .logo-text { color: #fff; font-weight: 800; font-size: 18px; }
  .company-name { font-weight: 700; font-size: 15px; color: #0a2540; }
  .company-sub { font-size: 8.5px; color: #64748b; }
  .order-doc-title { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; }
  .order-number { text-align: right; }
  .order-number-value { font-size: 22px; font-weight: 800; color: #d6007e; letter-spacing: -0.5px; }
  .order-meta { font-size: 8.5px; color: #64748b; margin-top: 2px; }
  .status-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 600; background: rgba(255,255,255,0.2); color: #fff; }
  /* Sections */
  .section { margin-bottom: 15px; page-break-inside: avoid; }
  .section-title {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.9px;
    color: #0a2540; margin-bottom: 9px; padding: 6px 0 6px 11px;
    border-left: 4px solid #d6007e; background: #f4f7fb; border-radius: 0 4px 4px 0;
  }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .info-box { background: #f8fafc; border: 1px solid #e6ebf2; border-radius: 8px; padding: 11px; }
  .info-label { font-size: 8px; font-weight: 700; color: #8a97a8; text-transform: uppercase; letter-spacing: 0.6px; }
  .info-value { font-size: 10px; color: #1f2937; margin-top: 3px; font-weight: 500; }
  /* Tables */
  table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 9px; border-radius: 8px; }
  thead tr { background: #0a2540; color: #fff; }
  thead th { padding: 7px 9px; text-align: left; font-weight: 600; letter-spacing: 0.3px; }
  tbody tr:nth-child(even) { background: #f4f7fb; }
  tbody td { padding: 6px 9px; border-bottom: 1px solid #e6ebf2; color: #334155; }
  tfoot tr { background: #0066ff; color: #fff; }
  tfoot td { padding: 7px 9px; font-weight: 700; }
  /* Vraag/antwoord */
  .qa td { padding: 5px 9px; border-bottom: 1px solid #eef2f7; }
  .qa .q { color: #475569; width: 62%; }
  .qa .a { text-align: right; font-weight: 600; color:#0a2540; }
  /* Hardware-tabel */
  .hardware-table { width: 100%; border-collapse: collapse; font-size: 9px; }
  .hardware-table th { background: #eef3f9; text-align: left; padding: 6px 9px; font-weight: 700; color: #334155; border: 1px solid #e6ebf2; }
  .hardware-table td { padding: 6px 9px; border: 1px solid #e6ebf2; color: #1f2937; }
  .txt { font-weight: 600; color: #1f2937; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 8px; font-size: 8.5px; font-weight: 600; }
  .pill-yes { background: #dcf5e4; color: #15803d; }
  .pill-no { background: #ddf1fd; color: #0369a1; }
  .pill-empty { background: #f1f5f9; color: #94a3b8; }
  /* Beschrijving / meerwerk */
  .description-box { background: #f8fafc; border-left: 4px solid #0066ff; padding: 9px 11px; border-radius: 0 6px 6px 0; font-size: 9.5px; color: #334155; line-height: 1.55; }
  /* Foto's */
  .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
  .photo-item { page-break-inside: avoid; }
  .photo-item img { width: 100%; max-height: 220px; object-fit: contain; border: 1px solid #e6ebf2; border-radius: 8px; background: #f8fafc; }
  .photo-caption { font-size: 9px; color: #475569; margin-top: 4px; padding: 3px 6px; background: #f4f7fb; border-radius: 4px; }
  /* Handtekeningen */
  .sig-box { position: relative; min-height: 90px; width: 100%; background: transparent; border: none; padding: 0; }
  .sig-frame { position: absolute; inset: 0; width: 100%; height: 100%; }
  .sig-inner { position: relative; padding: 10px 12px; min-height: 90px; }
  .sig-img { width: 100%; max-height: 120px; object-fit: contain; }
  .sig-line { border-top: 1px dashed #cbd5e1; margin-top: 40px; padding-top: 4px; font-size: 8px; color: #94a3b8; }
  /* Footer */
  .footer { margin-top: 20px; padding-top: 12px; border-top: 3px solid #ffd400; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-meta { font-size: 8px; color: #94a3b8; line-height: 1.8; }
  .qr-img { width: 56px; height: 56px; }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="logo-block">
      ${logoDataUrl
        ? `<img src="${logoDataUrl}" alt="MDB Networks" class="mdb-logo" />`
        : `<div class="logo-box"><span class="logo-text">M</span></div>
           <div>
             <div class="company-name">MDB Networks</div>
             <div class="company-sub">Data- Telecom- en Narrowcasting Installaties</div>
           </div>`
      }
    </div>
    <div class="order-number">
      <div class="order-doc-title">Opleverdocument</div>
      <div class="order-number-value">${esc(data.number)}</div>
      <div class="order-meta">${esc(data.customer.name)} · ${formatDate(data.createdAt)}</div>
    </div>
  </div>

  <!-- PROJECT + KLANT -->
  <div class="section">
    <div class="section-title">Projectinformatie</div>
    <div class="grid-2" style="gap:10px">
      <div class="info-box">
        <div class="info-label">Opdracht</div>
        <div class="info-value" style="font-size:12px;font-weight:700">${esc(data.title)}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Opdrachtgever</div>
        ${opdrachtgever ? `<div class="info-value" style="font-size:11px;font-weight:700">${esc(opdrachtgever)}</div>` : ""}
        <div class="info-value" style="font-size:11px;font-weight:700">${esc(data.customer.name)}</div>
        ${data.customer.address ? `<div class="info-value" style="font-size:9px;color:#64748b">${esc(data.customer.address)}</div>` : ""}
        ${data.customer.phone ? `<div class="info-value" style="font-size:9px;color:#64748b">${esc(data.customer.phone)}</div>` : ""}
      </div>
    </div>
  </div>

  <!-- META -->
  <div class="section">
    ${(()=>{
        const alleMonteurs = [
            data.engineerName,
            oplever.tarief.monteur2,
            oplever.tarief.monteur3,
            oplever.tarief.monteur4
        ].filter(m=>m && String(m).trim());

        if(alleMonteurs.length === 0){ return ""; }

        return `<div style="display:grid;grid-template-columns:repeat(${alleMonteurs.length},1fr);gap:8px;margin-bottom:8px">
            ${alleMonteurs.map(m=>`
              <div class="info-box">
                <div class="info-label">Monteur</div>
                <div class="info-value">${esc(String(m))}</div>
              </div>
            `).join("")}
        </div>`;
    })()}
    <div class="grid-2" style="gap:8px">
      <div class="info-box">
        <div class="info-label">Uitgevoerd op</div>
        <div class="info-value">${formatDate(data.workDate ?? data.plannedDate)}</div>
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

  <!-- OPLEVERFORMULIER -->
  ${opleverSections(oplever,data.engineerName)}

  <!-- KLANT-SPECIFIEKE VELDEN -->
  ${customFieldsSection(data.customerSchema, oplever.custom)}

  <!-- AFRONDING -->
  ${
    (
      oplever.afronding.vervolgafspraken ||
      oplever.afronding.meerwerkMateriaal ||
      oplever.afronding.meerwerkInOpdrachtVan ||
      oplever.afronding.netwerkGecontroleerdDoor
    ) ? `
  <div class="section">
    <div class="section-title">Afronding</div>
    <table class="qa">
      ${oplever.afronding.vervolgafspraken ? row("Nog af te ronden / vervolgafspraken / advies aan klant", textAnswer(oplever.afronding.vervolgafspraken)) : ""}
      ${oplever.afronding.meerwerkMateriaal ? row("Meerwerk- en materiaal geleverd", textAnswer(oplever.afronding.meerwerkMateriaal)) : ""}
      ${oplever.afronding.meerwerkInOpdrachtVan ? row("Meerarbeid en -materialen geleverd in opdracht van", textAnswer(oplever.afronding.meerwerkInOpdrachtVan)) : ""}
      ${oplever.afronding.netwerkGecontroleerdDoor ? row("Netwerkverbinding mediaspelers gecontroleerd door", textAnswer(oplever.afronding.netwerkGecontroleerdDoor)) : ""}
    </table>
  </div>` : ""
  }

  <!-- FOTO'S -->
  ${data.photos.length > 0 ? `
  <div class="section">
    <div class="section-title">Foto's</div>
    <div class="photo-grid">
      ${data.photos.map(foto=>`
        <div class="photo-item">
          <img src="${esc(foto.url)}" alt="Foto" />
          ${foto.caption ? `<div class="photo-caption">${esc(foto.caption)}</div>` : ""}
        </div>
      `).join("")}
    </div>
  </div>` : ""}

  <!-- HANDTEKENING -->
  <div class="section">
    <div class="section-title">Handtekening</div>
    <div>
      <div class="info-label" style="margin-bottom:4px">Handtekening klant</div>
      <div class="sig-box">
        <svg class="sig-frame" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" preserveAspectRatio="none">
          <rect x="1" y="1" width="398" height="98" rx="12" ry="12" fill="#ffffff" stroke="#e6ebf2" stroke-width="1.5"/>
        </svg>
        <div class="sig-inner">
        ${data.signatureUrl ? `<img src="${esc(data.signatureUrl)}" class="sig-img" alt="Handtekening klant" />` : (oplever.afronding.handtekening ? `<img src="${oplever.afronding.handtekening}" class="sig-img" alt="Handtekening klant" />` : "")}
        <div class="sig-line">Naam: ${esc(data.signedBy) || esc(oplever.afronding.contactpersoon) || "_________________________________"}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-meta">
      <div style="font-weight:700;color:#1e293b;margin-bottom:2px">MDB Networks</div>
      <div>Opdrachtnummer: ${esc(data.number)}</div>
      <div>Gegenereerd: ${formatDateTime(new Date())}</div>
    </div>
  </div>

</div>
</body>
</html>`;

}




export async function generateWorkorderHtmlPdf(
    data:WorkorderHtmlPdfInput,
    appUrl:string
):Promise<Buffer> {


    try {
        return await renderWorkorderPdfWithBrowser(data);
    } catch (error) {
        console.error("HTML PDF (puppeteer) mislukt, fallback pdf-lib:", error);
        return await renderWorkorderPdfWithPdfLib(data);
    }

}


async function renderWorkorderPdfWithPdfLib(
    data:WorkorderHtmlPdfInput
):Promise<Buffer> {

    const bytes = await generateOpleverPdf({
        number: data.number,
        title: data.title,
        customerName: data.customer.name,
        customerAddress: data.customer.address,
        projectName: data.projectName,
        date: data.plannedDate || data.workDate,
        engineers: [data.engineerName],
        hoursTotal: data.hours.reduce(
            (sum, item) => sum + Number(item.hours),
            0
        ),
        materials: (data.hardware ?? []).map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: null,
        })),
        photoUrls: data.photos.map((foto) => foto.url),
        signatureUrl: data.signatureUrl,
        signedBy: data.signedBy,
        formData: data.formData,
    });

    return Buffer.from(bytes);
}


async function renderWorkorderPdfWithBrowser(
    data:WorkorderHtmlPdfInput
):Promise<Buffer> {


    const logoDataUrl = mdbLogoDataUrl();


    const html =
        generateHtml(
            data,
            logoDataUrl
        );


    const browser =
        await launchBrowserForPdf();


    try {

        const page =
            await browser.newPage();

        await page.setContent(html,{
            waitUntil:"domcontentloaded",
            timeout:45_000
        });

        // Korte pauze zodat externe foto-URL's kunnen laden (zonder networkidle0).
        await new Promise((resolve)=>setTimeout(resolve,2_000));

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
