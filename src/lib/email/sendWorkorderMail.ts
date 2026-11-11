import {
    internalNotificationRecipients,
    sendResendEmail,
} from "@/lib/email/resendClient";

export interface WorkorderMailData {
    workorderNumber: string;
    customer: string;
    project: string;
    /** Locatie / filiaalnaam (`title`); leeg wordt `*`. */
    locatieFiliaalnaam?: string | null;
    /** Straat + huisnummer. */
    adres?: string | null;
    plaats?: string | null;
    /** Alle uitvoerende monteurs (assigned + extra engineers). */
    monteurs: string[];
    datum: string;
    /** Deep link naar de werkbon in PMS (kantoor). */
    workorderUrl?: string | null;
    pdfBuffer?: Buffer | null;
    zipBuffer?: Buffer | null;
}

export function nederlandseNamenlijst(names: string[]): string {
    const unique: string[] = [];
    const seen = new Set<string>();

    for (const raw of names) {
        const name = (raw || "").trim();
        const key = name.toLowerCase();
        if (!name || seen.has(key)) continue;
        seen.add(key);
        unique.push(name);
    }

    if (unique.length === 0) return "Een monteur";
    if (unique.length === 1) return unique[0];
    if (unique.length === 2) return `${unique[0]} en ${unique[1]}`;

    return `${unique.slice(0, -1).join(", ")} en ${unique[unique.length - 1]}`;
}

function aantalMonteurs(names: string[]): number {
    const seen = new Set<string>();
    for (const raw of names) {
        const name = (raw || "").trim().toLowerCase();
        if (name) seen.add(name);
    }
    return seen.size;
}

export function locatieFiliaalregel(
    locatieFiliaalnaam: string | null | undefined,
    datum: string
): string {
    const naam = (locatieFiliaalnaam || "").trim() || "*";
    return `Locatie / filiaalnaam: ${naam} — ${datum}`;
}

export function adresgegevensregel(
    adres: string | null | undefined,
    plaats: string | null | undefined
): string | null {
    const street = (adres || "").trim();
    const city = (plaats || "").trim();
    const value = [street, city].filter(Boolean).join(" - ");
    if (!value) return null;
    return `Adresgegevens: ${value}`;
}

export async function sendWorkorderMail(data: WorkorderMailData) {
    const monteursTekst = nederlandseNamenlijst(data.monteurs);
    const werkwoord = aantalMonteurs(data.monteurs) > 1 ? "hebben" : "heeft";
    const locatieRegel = locatieFiliaalregel(data.locatieFiliaalnaam, data.datum);
    const adresRegel = adresgegevensregel(data.adres, data.plaats);
    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://pms.mdb-networks.nl";
    const werkbonUrl =
        (data.workorderUrl || "").trim()
        || `${baseUrl.replace(/\/$/, "")}/workorders`;

    const pdfZin = data.pdfBuffer
        ? "De opdracht-PDF is als bijlage toegevoegd."
        : "De PDF-bijlage kon niet worden gegenereerd; open de opdracht in PMS.";
    const zipZin = data.zipBuffer
        ? "De foto's staan in een aparte ZIP-bijlage."
        : "";

    const tekst = `Beste Projects,

${monteursTekst} ${werkwoord} een opdracht afgerond en verstuurd.

Opdrachtnummer: ${data.workorderNumber}
Opdrachtgever: ${data.customer}
${locatieRegel}${adresRegel ? `\n${adresRegel}` : ""}

Opdracht openen:
${werkbonUrl}

${pdfZin}${zipZin ? `\n${zipZin}` : ""}

Team MDB Networks
`;

    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">

  <p>Beste Projects,</p>

  <p><strong>${monteursTekst}</strong> ${werkwoord} een opdracht afgerond en verstuurd.</p>

  <p>
    <strong>Opdrachtnummer:</strong> ${data.workorderNumber}<br>
    <strong>Opdrachtgever:</strong> ${data.customer}<br>
    <strong>Locatie / filiaalnaam:</strong> ${(data.locatieFiliaalnaam || "").trim() || "*"} &mdash; ${data.datum}${
        adresRegel
            ? `<br>
    <strong>Adresgegevens:</strong> ${[ (data.adres || "").trim(), (data.plaats || "").trim() ].filter(Boolean).join(" - ")}`
            : ""
    }
  </p>

  <p>
    <a href="${werkbonUrl}"
       style="display:inline-block;background:#d6007e;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700">
       Opdracht openen
    </a>
  </p>

  <p style="color:#64748b;font-size:13px">
    ${pdfZin}${zipZin ? `<br>${zipZin}` : ""}
  </p>

  <p>Team MDB Networks</p>

</div>`;

    const attachments = [
        ...(data.pdfBuffer
            ? [
                  {
                      filename: `${data.workorderNumber}.pdf`,
                      content: data.pdfBuffer.toString("base64"),
                  },
              ]
            : []),
        ...(data.zipBuffer
            ? [
                  {
                      filename: `${data.workorderNumber}-fotos.zip`,
                      content: data.zipBuffer.toString("base64"),
                  },
              ]
            : []),
    ];

    await sendResendEmail({
        from: "MDB Networks <noreply@mdb-networks.nl>",
        to: internalNotificationRecipients(),
        subject: `Opdracht afgerond — ${data.project} (${data.workorderNumber})`,
        text: tekst,
        html,
        attachments: attachments.length > 0 ? attachments : undefined,
    });
}
