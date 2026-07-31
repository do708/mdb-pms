import { Resend } from "resend";



const resend = process.env.RESEND_API_KEY

    ? new Resend(process.env.RESEND_API_KEY)

    : null;





interface WorkorderMailProps {


    pdf: Buffer;


    filename: string;


    workorderNumber: string;


    customer?: string;


    project?: string;


}





export async function sendWorkorderMail({

    pdf,

    filename,

    workorderNumber,

    customer,

    project,

}: WorkorderMailProps) {



    if(!resend){


        throw new Error(

            "RESEND_API_KEY ontbreekt"

        );


    }





    await resend.emails.send({


        from:

            "MDB PMS <noreply@mdb-networks.nl>",



        to:[

            "projects@mdb-networks.nl"

        ],



        subject:

            `Werkbon ${workorderNumber} afgerond`,




        html:

        `

        <h2>Werkbon afgerond</h2>


        <p>
            Werkbon:
            <strong>${workorderNumber}</strong>
        </p>


        <p>
            Opdrachtgever:
            ${customer ?? ""}
        </p>


        <p>
            Project:
            ${project ?? ""}
        </p>


        <p>
            De werkbon is automatisch gegenereerd
            vanuit MDB Project Management Systeem.
        </p>

        `,



        attachments:[

            {

                filename,

                content: pdf

            }

        ]



    });


}