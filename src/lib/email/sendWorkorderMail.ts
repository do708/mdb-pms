import { Resend } from "resend";



const resend =
    process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;



interface WorkorderMailData {

    workorderNumber:string;

    customer:string;

    project:string;

    monteur:string;

    datum:string;

    pdfBuffer:Buffer;

}



export async function sendWorkorderMail(
    data:WorkorderMailData
){


    if(!resend){
        throw new Error("RESEND_API_KEY ontbreekt");
    }



    const tekst =
`Beste Projects,

${data.monteur} heeft een nieuwe werkbon/formulier ingevuld.

Klant: ${data.customer}
Opdracht: ${data.project} - ${data.datum}

Project Management System:
https://pms.mdb-networks.nl

De werkbon PDF is als bijlage toegevoegd.

Team MDB Networks
`;


    const html =
`<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">

  <p>Beste Projects,</p>

  <p><strong>${data.monteur}</strong> heeft een nieuwe werkbon/formulier ingevuld.</p>

  <p>
    <strong>Klant:</strong> ${data.customer}<br>
    <strong>Opdracht:</strong> ${data.project} &mdash; ${data.datum}
  </p>

  <p>
    <a href="https://pms.mdb-networks.nl"
       style="display:inline-block;background:#d6007e;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700">
       Project Management System
    </a>
  </p>

  <p style="color:#64748b;font-size:13px">De werkbon PDF is als bijlage toegevoegd.</p>

  <p>Team MDB Networks</p>

</div>`;



    await resend.emails.send({

        from:
            "MDB Networks <noreply@mdb-networks.nl>",

        to:[
            "projects@mdb-networks.nl"
        ],

        subject:
            `Nieuwe werkbon ingevuld — ${data.project} (${data.workorderNumber})`,

        text:
            tekst,

        html:
            html,

        attachments:[
            {
                filename:
                    `${data.workorderNumber}.pdf`,
                content:
                    data.pdfBuffer.toString("base64")
            }
        ]

    });

}
