import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import {
    TOOL_CATEGORY_LABELS,
    TOOL_STATUS_LABELS,
    isToolCategory,
    type ToolCategory,
    type ToolStatus,
} from "@/constants/gereedschap";
import type { ExportAssetRow } from "@/lib/gereedschap/export";

function fmtDate(d: Date | null | undefined): string {
    if (!d) return "—";
    return d.toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function categoryLabel(cat: string): string {
    return isToolCategory(cat)
        ? TOOL_CATEGORY_LABELS[cat as ToolCategory]
        : cat;
}

function statusLabel(status: string): string {
    return TOOL_STATUS_LABELS[status as ToolStatus] ?? status;
}

/**
 * PDF-overzicht van het gereedschapsregister (landscape A4).
 */
export async function buildRegisterPdf(
    rows: ExportAssetRow[]
): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    // A4 landscape
    const pageW = 842;
    const pageH = 595;
    const margin = 28;
    const rowH = 16;
    const headerH = 18;

    const cols: {
        label: string;
        width: number;
        get: (r: ExportAssetRow) => string;
    }[] = [
        { label: "Code", width: 78, get: (r) => r.code },
        {
            label: "Wat / naam",
            width: 120,
            get: (r) => r.name.slice(0, 28),
        },
        {
            label: "Categorie",
            width: 90,
            get: (r) => categoryLabel(r.category).slice(0, 22),
        },
        {
            label: "Toegewezen",
            width: 90,
            get: (r) => (r.assignedName ?? "—").slice(0, 20),
        },
        {
            label: "Bus",
            width: 58,
            get: (r) => r.busKenteken ?? (r.kantoor ? "Kantoor" : "—"),
        },
        {
            label: "Aanschaf",
            width: 62,
            get: (r) => fmtDate(r.purchasedAt ?? r.createdAt),
        },
        {
            label: "Keuring",
            width: 62,
            get: (r) => fmtDate(r.lastInspectionAt),
        },
        {
            label: "Volgende",
            width: 62,
            get: (r) => fmtDate(r.nextInspectionAt),
        },
        {
            label: "Status",
            width: 72,
            get: (r) => statusLabel(r.status).slice(0, 16),
        },
    ];

    let page = doc.addPage([pageW, pageH]);
    let y = pageH - margin;

    const drawHeader = () => {
        page.drawText("MDB Networks — Gereedschapsregister", {
            x: margin,
            y: y - 4,
            size: 13,
            font: bold,
            color: rgb(0, 0.4, 1),
        });
        y -= 18;
        page.drawText(
            `Overzicht · ${rows.length} items · ${new Date().toLocaleString("nl-NL")}`,
            {
                x: margin,
                y,
                size: 8,
                font,
                color: rgb(0.35, 0.4, 0.45),
            }
        );
        y -= 16;

        let x = margin;
        page.drawRectangle({
            x: margin - 2,
            y: y - 4,
            width: pageW - margin * 2 + 4,
            height: headerH,
            color: rgb(0, 0.4, 1),
        });
        for (const col of cols) {
            page.drawText(col.label, {
                x: x + 2,
                y: y + 2,
                size: 8,
                font: bold,
                color: rgb(1, 1, 1),
            });
            x += col.width;
        }
        y -= headerH + 2;
    };

    drawHeader();

    for (const row of rows) {
        if (y < margin + rowH) {
            page = doc.addPage([pageW, pageH]);
            y = pageH - margin;
            drawHeader();
        }

        let x = margin;
        const values = cols.map((c) => c.get(row));
        for (let i = 0; i < cols.length; i++) {
            page.drawText(values[i] || "—", {
                x: x + 2,
                y: y + 2,
                size: 7.5,
                font,
                color: rgb(0.05, 0.1, 0.2),
                maxWidth: cols[i].width - 4,
            });
            x += cols[i].width;
        }
        y -= rowH;
        page.drawLine({
            start: { x: margin, y: y + rowH - 2 },
            end: { x: pageW - margin, y: y + rowH - 2 },
            thickness: 0.3,
            color: rgb(0.85, 0.88, 0.9),
        });
    }

    return doc.save();
}
