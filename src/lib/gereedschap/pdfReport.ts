import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import {
    TOOL_CATEGORY_LABELS,
    TOOL_CATEGORY_NORM,
    isToolCategory,
    type ToolCategory,
} from "@/constants/gereedschap";

type PdfInput = {
    code: string;
    name: string;
    category: string;
    result: string;
    inspectedAt: Date;
    validUntil: Date | null;
    inspectorName: string;
    notes?: string | null;
    checklist: { id: string; label: string; ok: boolean }[];
};

/**
 * Eenvoudige keurings-PDF stub (pdf-lib). Geen externe browser nodig.
 */
export async function buildInspectionPdf(
    input: PdfInput
): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    const category = isToolCategory(input.category)
        ? (input.category as ToolCategory)
        : null;

    let y = 800;
    const left = 50;

    const line = (text: string, size = 11, useBold = false) => {
        page.drawText(text, {
            x: left,
            y,
            size,
            font: useBold ? bold : font,
            color: rgb(0.05, 0.1, 0.2),
        });
        y -= size + 8;
    };

    line("MDB Networks — Keuringsrapport", 16, true);
    line("(stub — eerste slice)", 9);
    y -= 6;
    line(`Asset: ${input.code}`, 12, true);
    line(`Naam: ${input.name}`);
    line(
        `Categorie: ${
            category ? TOOL_CATEGORY_LABELS[category] : input.category
        }`
    );
    if (category) {
        line(`Norm: ${TOOL_CATEGORY_NORM[category]}`);
    }
    line(`Resultaat: ${input.result.toUpperCase()}`, 12, true);
    line(`Gekeurd op: ${input.inspectedAt.toLocaleString("nl-NL")}`);
    if (input.validUntil) {
        line(`Geldig tot: ${input.validUntil.toLocaleDateString("nl-NL")}`);
    }
    line(`Keurmeester: ${input.inspectorName}`);
    y -= 8;
    line("Checklist", 12, true);
    for (const item of input.checklist) {
        line(`[${item.ok ? "OK" : "NOK"}] ${item.label}`, 10);
        if (y < 80) break;
    }
    if (input.notes) {
        y -= 6;
        line("Opmerkingen", 12, true);
        line(input.notes.slice(0, 400), 10);
    }

    page.drawText("MDB Networks Tool & Safety Management", {
        x: left,
        y: 40,
        size: 8,
        font,
        color: rgb(0.4, 0.45, 0.5),
    });

    return doc.save();
}
