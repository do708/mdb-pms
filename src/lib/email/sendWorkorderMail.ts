import nodemailer from "nodemailer";



interface WorkorderMailData {

    workorderNumber:string;

    customer:string;

    project:string;

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

            `Werkbon afgerond ${data.workorderNumber}`,



        text:

`Werkbon afgerond

Werkbon:
${data.workorderNumber}

Klant:
${data.customer}

Project:
${data.project}

De werkbon PDF is toegevoegd.
`,




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