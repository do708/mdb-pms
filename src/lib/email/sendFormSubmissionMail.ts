import { getFormDefinition } from "@/constants/formDefinitions";

import {
    escapeHtml,
    summarizeFormData,
} from "@/lib/email/formDataSummary";
import {
    internalNotificationRecipients,
    sendResendEmail,
} from "@/lib/email/resendClient";

interface FormSubmissionMailData {
    formType: string;
    title: string;
    submitterName: string;
    data: Record<string, unknown>;
}

export async function sendFormSubmissionMail(data: FormSubmissionMailData) {
    const definition = getFormDefinition(data.formType);
    const label = definition?.label ?? data.formType;
    const summary = definition
        ? summarizeFormData(definition, data.data)
        : JSON.stringify(data.data, null, 2);

    const formsUrl = "https://pms.mdb-networks.nl/forms";

    const tekst = `Nieuw ingevuld formulier via PMS

Formulier: ${label}
Titel: ${data.title}
Ingevoerd door: ${data.submitterName}

${summary}

Bekijk formulieren:
${formsUrl}

Team MDB Networks
`;

    const htmlSummary = escapeHtml(summary).replace(/\n/g, "<br>");

    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">
  <p style="font-size:16px;font-weight:800;color:#0066ff;margin-bottom:4px">
     Nieuw ingevuld formulier via PMS
  </p>
  <p><strong>Formulier:</strong> ${escapeHtml(label)}</p>
  <p><strong>Titel:</strong> ${escapeHtml(data.title)}</p>
  <p><strong>Ingevoerd door:</strong> ${escapeHtml(data.submitterName)}</p>
  <pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:13px">${htmlSummary}</pre>
  <p>
    <a href="${formsUrl}"
       style="display:inline-block;background:#0066ff;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700">
       Formulieren in PMS
    </a>
  </p>
  <p>Team MDB Networks</p>
</div>`;

    await sendResendEmail({
        from: "MDB Networks <noreply@mdb-networks.nl>",
        to: internalNotificationRecipients(),
        subject: `Nieuw formulier: ${label} — ${data.submitterName}`,
        text: tekst,
        html,
    });
}
