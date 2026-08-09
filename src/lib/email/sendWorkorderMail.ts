import {
    internalNotificationRecipients,
    sendResendEmail,
} from "@/lib/email/resendClient";

interface WorkorderMailData {
    workorderNumber: string;
    customer: string;
    project: string;
    location?: string | null;
    monteur: string;
    datum: string;
    /** Deep link naar de werkbon in PMS (kantoor). */
    workorderUrl?: string | null;
    pdfBuffer?: Buffer | null;
}

export async function sendWorkorderMail(data: WorkorderMailData) {
    const locatie = (data.location || "").trim() || "—";
    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://pms.mdb-networks.nl";
    const werkbonUrl =
        (data.workorderUrl || "").trim()
        || `${baseUrl.replace(/\/$/, "")}/workorders`;

    const tekst = `Beste Projects,

${data.monteur} heeft een opdracht afgerond en verstuurd.

Opdrachtnummer: ${data.workorderNumber}
Opdrachtgever: ${data.customer}
Opdracht: ${data.project} - ${data.datum}
Locatie: ${locatie}

Opdracht openen:
${werkbonUrl}

${data.pdfBuffer ? "De opdracht-PDF is als bijlage toegevoegd." : "De PDF-bijlage kon niet worden gegenereerd; open de opdracht in PMS."}

Team MDB Networks
`;

    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">

  <p>Beste Projects,</p>

  <p><strong>${data.monteur}</strong> heeft een opdracht afgerond en verstuurd.</p>

  <p>
    <strong>Opdrachtnummer:</strong> ${data.workorderNumber}<br>
    <strong>Opdrachtgever:</strong> ${data.customer}<br>
    <strong>Opdracht:</strong> ${data.project} &mdash; ${data.datum}<br>
    <strong>Locatie:</strong> ${locatie}
  </p>

  <p>
    <a href="${werkbonUrl}"
       style="display:inline-block;background:#d6007e;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700">
       Opdracht openen
    </a>
  </p>

  <p style="color:#64748b;font-size:13px">
    ${
        data.pdfBuffer
            ? "De opdracht-PDF is als bijlage toegevoegd."
            : "De PDF-bijlage kon niet worden gegenereerd; open de opdracht in PMS."
    }
  </p>

  <p>Team MDB Networks</p>

</div>`;

    await sendResendEmail({
        from: "MDB Networks <noreply@mdb-networks.nl>",
        to: internalNotificationRecipients(),
        subject: `Opdracht afgerond — ${data.project} (${data.workorderNumber})`,
        text: tekst,
        html,
        attachments: data.pdfBuffer
            ? [
                  {
                      filename: `${data.workorderNumber}.pdf`,
                      content: data.pdfBuffer.toString("base64"),
                  },
              ]
            : undefined,
    });
}
