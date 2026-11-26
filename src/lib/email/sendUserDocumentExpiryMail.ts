import {
    projectMailbox,
    sendResendEmail,
} from "@/lib/email/resendClient";
import { userDocumentTypeLabel } from "@/constants/userDocumentTypes";

export type ExpiringUserDocument = {
    id: string;
    type: string;
    number: string | null;
    expiresAt: Date;
    originalName: string | null;
    userName: string | null;
    userEmail: string;
};

function formatDateNL(date: Date): string {
    return date.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Amsterdam",
    });
}

/** Mail naar projects@ wanneer persoonsdocumenten binnen ~1 maand verlopen. */
export async function sendUserDocumentExpiryMail(
    items: ExpiringUserDocument[]
) {
    if (items.length === 0) {
        return;
    }

    const lines = items.map((item) => {
        const wie = item.userName?.trim() || item.userEmail;
        const soort = userDocumentTypeLabel(item.type);
        const nummer = item.number?.trim()
            ? ` (nr. ${item.number.trim()})`
            : "";
        const bestand = item.originalName
            ? ` — ${item.originalName}`
            : "";
        return `• ${wie} — ${soort}${nummer}: verloopt op ${formatDateNL(item.expiresAt)}${bestand}`;
    });

    const tekst = `Documenten verlopen binnenkort

De volgende persoonsdocumenten verlopen binnen één maand:

${lines.join("\n")}

Werk de documenten bij via Gebruikers → Wijzigen in PMS.

Team MDB Networks
`;

    const htmlRows = items
        .map((item) => {
            const wie = item.userName?.trim() || item.userEmail;
            const soort = userDocumentTypeLabel(item.type);
            const nummer = item.number?.trim()
                ? ` <span style="color:#64748b">(nr. ${item.number.trim()})</span>`
                : "";
            return `<tr>
  <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${wie}<br/><span style="color:#64748b;font-size:12px">${item.userEmail}</span></td>
  <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${soort}${nummer}</td>
  <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;white-space:nowrap">${formatDateNL(item.expiresAt)}</td>
</tr>`;
        })
        .join("\n");

    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">
  <p style="font-size:16px;font-weight:800;color:#0066ff;margin-bottom:4px">
    Documenten verlopen binnenkort
  </p>
  <p>De volgende persoonsdocumenten verlopen binnen één maand:</p>
  <table style="border-collapse:collapse;width:100%;max-width:640px;margin:12px 0">
    <thead>
      <tr style="background:#f8fafc;text-align:left">
        <th style="padding:8px 12px;border-bottom:2px solid #e2e8f0">Gebruiker</th>
        <th style="padding:8px 12px;border-bottom:2px solid #e2e8f0">Document</th>
        <th style="padding:8px 12px;border-bottom:2px solid #e2e8f0">Verloopt</th>
      </tr>
    </thead>
    <tbody>
      ${htmlRows}
    </tbody>
  </table>
  <p>Werk de documenten bij via <strong>Gebruikers → Wijzigen</strong> in PMS.</p>
  <p>Team MDB Networks</p>
</div>`;

    await sendResendEmail({
        from: "MDB Networks <noreply@mdb-networks.nl>",
        to: [projectMailbox()],
        subject:
            items.length === 1
                ? `Document verloopt binnenkort: ${items[0].userName || items[0].userEmail}`
                : `${items.length} documenten verlopen binnenkort`,
        text: tekst,
        html,
    });
}
