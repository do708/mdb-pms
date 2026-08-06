import {
    internalNotificationRecipients,
    sendResendEmail,
} from "@/lib/email/resendClient";

interface AanvraagMailData {
    opdrachtgever: string;
    locatie: string;
}

// Notificatie naar kantoor wanneer een opdrachtgever een nieuwe aanvraag
// indient via de publieke portal.
export async function sendAanvraagMail(data: AanvraagMailData) {
    const dashboardUrl = "https://pms.mdb-networks.nl/dashboard";

    const tekst = `Nieuwe opdrachtaanvraag via PMS

${data.opdrachtgever} heeft een nieuwe aanvraag ingediend via de portal.

Locatie: ${data.locatie}

Bekijk de aanvraag op het dashboard:
${dashboardUrl}

Team MDB Networks
`;

    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">

  <p style="font-size:16px;font-weight:800;color:#0066ff;margin-bottom:4px">
     Nieuwe opdrachtaanvraag via PMS
  </p>

  <p><strong>${data.opdrachtgever}</strong> heeft een nieuwe aanvraag ingediend via de portal.</p>

  <p><strong>Locatie:</strong> ${data.locatie}</p>

  <p>
    <a href="${dashboardUrl}"
       style="display:inline-block;background:#0066ff;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700">
       Bekijk op dashboard
    </a>
  </p>

  <p>Team MDB Networks</p>

</div>`;

    await sendResendEmail({
        from: "MDB Networks <noreply@mdb-networks.nl>",
        to: internalNotificationRecipients(),
        subject: `Nieuwe opdrachtaanvraag via PMS: ${data.opdrachtgever} - ${data.locatie}`,
        text: tekst,
        html,
    });
}
