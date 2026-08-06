import { projectMailbox, sendResendEmail } from "@/lib/email/resendClient";

interface WorkorderMailData {
    workorderNumber: string;
    customer: string;
    project: string;
    monteur: string;
    datum: string;
    pdfBuffer: Buffer;
}

export async function sendWorkorderMail(data: WorkorderMailData) {
    const tekst = `Beste Projects,

${data.monteur} heeft een nieuwe werkbon/formulier ingevuld.

Opdrachtgever: ${data.customer}
Opdracht: ${data.project} - ${data.datum}

Project Management System:
https://pms.mdb-networks.nl

De werkbon PDF is als bijlage toegevoegd.

Team MDB Networks
`;

    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">

  <p>Beste Projects,</p>

  <p><strong>${data.monteur}</strong> heeft een nieuwe werkbon/formulier ingevuld.</p>

  <p>
    <strong>Opdrachtgever:</strong> ${data.customer}<br>
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

    await sendResendEmail({
        from: "MDB Networks <noreply@mdb-networks.nl>",
        to: [projectMailbox()],
        subject: `Nieuwe werkbon ingevuld — ${data.project} (${data.workorderNumber})`,
        text: tekst,
        html,
        attachments: [
            {
                filename: `${data.workorderNumber}.pdf`,
                content: data.pdfBuffer.toString("base64"),
            },
        ],
    });
}
