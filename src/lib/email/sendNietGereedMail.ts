import { Resend } from "resend";



const resend =
    process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;



interface NietGereedMailData {

    workorderNumber:string;

    opdrachtgever:string;

    klant:string;

    adres:string;

    werkzaamheden:string;

    omschrijving:string;

    monteur:string;

}



// Melding naar kantoor wanneer een monteur een werkbon afrondt met
// "Werkzaamheden niet gereed". Kantoor kan dan opnieuw inplannen en
// eventueel materiaal bestellen.
export async function sendNietGereedMail(
    data:NietGereedMailData
){


    if(!resend){
        throw new Error("RESEND_API_KEY ontbreekt");
    }



    const tekst =
`Werkzaamheden niet gereed

Monteur ${data.monteur} heeft een werkbon afgerond, maar de werkzaamheden zijn NIET gereed.

Werkbon: ${data.workorderNumber}
Opdrachtgever: ${data.opdrachtgever}
Opdrachtgever: ${data.klant}
Adres: ${data.adres}
Werkzaamheden: ${data.werkzaamheden}

Wat moet er nog gebeuren / benodigde materialen:
${data.omschrijving}

Graag opnieuw inplannen en eventueel materiaal bestellen.

Project Management System:
https://pms.mdb-networks.nl

Team MDB Networks
`;


    const html =
`<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">

  <p style="font-size:16px;font-weight:800;color:#d6007e;margin-bottom:4px">
     Werkzaamheden niet gereed
  </p>

  <p>Monteur <strong>${data.monteur}</strong> heeft een werkbon afgerond, maar de
     werkzaamheden zijn <strong>niet gereed</strong>.</p>

  <p>
    <strong>Werkbon:</strong> ${data.workorderNumber}<br>
    <strong>Opdrachtgever:</strong> ${data.opdrachtgever}<br>
    <strong>Opdrachtgever:</strong> ${data.klant}<br>
    <strong>Adres:</strong> ${data.adres}<br>
    <strong>Werkzaamheden:</strong> ${data.werkzaamheden}
  </p>

  <p>
    <strong>Wat moet er nog gebeuren / benodigde materialen:</strong><br>
    ${data.omschrijving.replace(/\n/g, "<br>")}
  </p>

  <p style="color:#64748b;font-size:13px">
     Graag opnieuw inplannen en eventueel materiaal bestellen.
  </p>

  <p>
    <a href="https://pms.mdb-networks.nl"
       style="display:inline-block;background:#d6007e;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700">
       Project Management System
    </a>
  </p>

  <p>Team MDB Networks</p>

</div>`;



    await resend.emails.send({

        from:
            "MDB Networks <noreply@mdb-networks.nl>",

        to:[
            "projects@mdb-networks.nl"
        ],

        subject:
            `Werkzaamheden niet gereed — ${data.werkzaamheden} (${data.workorderNumber})`,

        text:
            tekst,

        html:
            html

    });

}
