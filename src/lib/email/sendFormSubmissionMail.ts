import { getFormDefinition } from "@/constants/formDefinitions";

import {
    escapeHtml,
    summarizeFormData,
} from "@/lib/email/formDataSummary";
import {
    infoMailbox,
    projectMailbox,
    sendResendEmail,
} from "@/lib/email/resendClient";
import { isBlankHoursOrTimeValue } from "@/constants/formDefinitions";
import { nlFormDate, verlofMonteurName } from "@/lib/forms/formDisplay";
import { isKortVerlof } from "@/lib/reports/vacation";

interface FormSubmissionMailData {
    formType: string;
    title: string;
    submitterName: string;
    data: Record<string, unknown>;
}

function strField(data: Record<string, unknown>, key: string): string {
    const raw = data[key];

    if (typeof raw === "number" && Number.isFinite(raw)) {
        return String(raw);
    }

    return typeof raw === "string" ? raw.trim() : "";
}

function namesMatch(a: string, b: string): boolean {
    return a.trim().toLocaleLowerCase("nl-NL") === b.trim().toLocaleLowerCase("nl-NL");
}

function buildVerlofMail(data: FormSubmissionMailData, formsUrl: string) {
    const werknemer = verlofMonteurName(data.data, data.submitterName);
    const from = nlFormDate(data.data.eersteDag);
    const to = nlFormDate(data.data.laatsteDag);
    const period =
        from && to
            ? `${from} t/m ${to}`
            : from || to || "";
    const aanvraag = nlFormDate(data.data.datumAanvraag);
    const typeVerlof = strField(data.data, "typeVerlof");
    const redenKort = strField(data.data, "redenKortVerlof");
    const reden = strField(data.data, "reden");
    const urenRaw = strField(data.data, "totaalUren");
    const vanRaw = strField(data.data, "vanTijd");
    const totRaw = strField(data.data, "totTijd");
    const showHours = isKortVerlof(typeVerlof);
    const uren =
        showHours && !isBlankHoursOrTimeValue(urenRaw) ? urenRaw : "";
    const vanTijd =
        showHours && !isBlankHoursOrTimeValue(vanRaw) ? vanRaw : "";
    const totTijd =
        showHours && !isBlankHoursOrTimeValue(totRaw) ? totRaw : "";
    const handtekening = strField(data.data, "handtekening");
    const andereInvoerder = !namesMatch(werknemer, data.submitterName);

    const extraLines: string[] = [];

    if (typeVerlof) {
        extraLines.push(`Type verlof: ${typeVerlof}`);
    }

    if (redenKort) {
        extraLines.push(`Reden kort verlof: ${redenKort}`);
    } else if (reden) {
        extraLines.push(`Reden: ${reden}`);
    }

    if (uren) {
        extraLines.push(`Totaal aantal uren: ${uren}`);
    }

    if (vanTijd || totTijd) {
        extraLines.push(
            `Tijd: ${[vanTijd, totTijd].filter(Boolean).join(" – ")}`
        );
    }

    if (handtekening) {
        extraLines.push(
            "Handtekening medewerker: Handtekening ontvangen"
        );
    }

    const invoerLine = andereInvoerder
        ? `Ingevoerd door: ${data.submitterName}\n`
        : "";
    const extraBlock = extraLines.length ? `${extraLines.join("\n")}\n\n` : "";
    const aanvraagLine = aanvraag
        ? `Aanvraagdatum: ${aanvraag}\n`
        : "";

    const tekst = `Nieuw ingevuld formulier via PMS

Formulier: Verlofaanvraag
Werknemer: ${werknemer}
${invoerLine}
Verlof: ${period}

${aanvraagLine}${extraBlock}Bekijk formulieren:
${formsUrl}

Team MDB Networks
`;

    const htmlExtra = extraLines
        .map((line) => `<p style="margin:4px 0">${escapeHtml(line)}</p>`)
        .join("");
    const htmlInvoer = andereInvoerder
        ? `<p style="margin:4px 0"><strong>Ingevoerd door:</strong> ${escapeHtml(data.submitterName)}</p>`
        : "";

    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">
  <p style="font-size:16px;font-weight:800;color:#0066ff;margin-bottom:4px">
     Nieuwe verlofaanvraag via PMS
  </p>
  <p style="margin:4px 0"><strong>Werknemer:</strong> ${escapeHtml(werknemer)}</p>
  ${htmlInvoer}
  <p style="font-size:18px;font-weight:800;margin:16px 0 8px;color:#0f172a">
    Verlof: <strong>${escapeHtml(period)}</strong>
  </p>
  ${
      aanvraag
          ? `<p style="margin:0 0 12px;font-size:12px;color:#64748b">Aanvraagdatum: ${escapeHtml(aanvraag)}</p>`
          : ""
  }
  ${htmlExtra}
  <p>
    <a href="${formsUrl}"
       style="display:inline-block;background:#0066ff;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700">
       Formulieren in PMS
    </a>
  </p>
  <p>Team MDB Networks</p>
</div>`;

    return {
        subject: `Nieuwe verlofaanvraag — ${werknemer}`,
        text: tekst,
        html,
    };
}

export async function sendFormSubmissionMail(data: FormSubmissionMailData) {
    const definition = getFormDefinition(data.formType);
    const label = definition?.label ?? data.formType;
    const formsUrl = "https://pms.mdb-networks.nl/forms";

    const verlofMail =
        data.formType === "verlof" ? buildVerlofMail(data, formsUrl) : null;

    const summary = definition
        ? summarizeFormData(definition, data.data)
        : JSON.stringify(data.data, null, 2);

    const tekst =
        verlofMail?.text ??
        `Nieuw ingevuld formulier via PMS

Formulier: ${label}
Titel: ${data.title}
Ingevoerd door: ${data.submitterName}

${summary}

Bekijk formulieren:
${formsUrl}

Team MDB Networks
`;

    const htmlSummary = escapeHtml(summary).replace(/\n/g, "<br>");

    const html =
        verlofMail?.html ??
        `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">
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
        to: [projectMailbox()],
        cc: [infoMailbox()],
        subject:
            verlofMail?.subject ??
            `Nieuw formulier: ${label} — ${data.submitterName}`,
        text: tekst,
        html,
    });
}
