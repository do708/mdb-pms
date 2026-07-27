import nodemailer from "nodemailer";



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



    const transporter =

        nodemailer.createTransport({

            host:
                process.env.SMTP_HOST,


            port:
                Number(process.env.SMTP_PORT || 587),


            secure:
                false,


            auth:{

                user:
                    process.env.SMTP_USER,


                pass:
                    process.env.SMTP_PASSWORD

            }

        });








    await transporter.sendMail({

        from:

            process.env.SMTP_FROM,



        to:

            "projects@mdb-networks.nl",



        subject:

            `Nieuwe werkbon ingevuld — ${data.project} (${data.workorderNumber})`,



        text:

`Beste Projects,

${data.monteur} heeft een nieuwe werkbon/formulier ingevuld.

Klant: ${data.customer}
Opdracht: ${data.project} - ${data.datum}

Project Management System:
https://pms.mdb-networks.nl

De werkbon PDF is als bijlage toegevoegd.

Team MDB Networks
`,



        html:

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

</div>`,




        attachments:[

            {

                filename:

                    `${data.workorderNumber}.pdf`,


                content:

                    data.pdfBuffer,


                contentType:

                    "application/pdf"

            }

        ]


    });


}