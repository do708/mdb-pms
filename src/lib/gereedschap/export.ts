import ExcelJS from "exceljs";

import {
    TOOL_CATEGORY_LABELS,
    TOOL_STATUS_LABELS,
    isToolCategory,
    type ToolCategory,
    type ToolStatus,
} from "@/constants/gereedschap";

export type ExportAssetRow = {
    code: string;
    category: string;
    name: string;
    serialNumber: string | null;
    status: string;
    busKenteken: string | null;
    kantoor: boolean;
    assignedName: string | null;
    lastInspectionAt: Date | null;
    nextInspectionAt: Date | null;
};

function categoryLabel(cat: string): string {
    return isToolCategory(cat)
        ? TOOL_CATEGORY_LABELS[cat as ToolCategory]
        : cat;
}

function statusLabel(status: string): string {
    return TOOL_STATUS_LABELS[status as ToolStatus] ?? status;
}

export function assetsToCsv(rows: ExportAssetRow[]): string {
    const header = [
        "code",
        "categorie",
        "naam",
        "serienummer",
        "status",
        "bus_kenteken",
        "kantoor",
        "toegewezen_aan",
        "laatste_keuring",
        "volgende_keuring",
    ];

    const lines = [header.join(";")];
    for (const r of rows) {
        lines.push(
            [
                r.code,
                categoryLabel(r.category),
                r.name,
                r.serialNumber ?? "",
                statusLabel(r.status),
                r.busKenteken ?? "",
                r.kantoor ? "ja" : "nee",
                r.assignedName ?? "",
                r.lastInspectionAt?.toISOString().slice(0, 10) ?? "",
                r.nextInspectionAt?.toISOString().slice(0, 10) ?? "",
            ]
                .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                .join(";")
        );
    }
    return lines.join("\n");
}

export async function assetsToExcel(
    rows: ExportAssetRow[]
): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = "MDB Networks";
    const sheet = wb.addWorksheet("Gereedschap");

    sheet.columns = [
        { header: "Code", key: "code", width: 16 },
        { header: "Categorie", key: "category", width: 28 },
        { header: "Naam", key: "name", width: 28 },
        { header: "Serienummer", key: "serial", width: 18 },
        { header: "Status", key: "status", width: 18 },
        { header: "Bus-kenteken", key: "bus", width: 14 },
        { header: "Kantoor", key: "kantoor", width: 10 },
        { header: "Toegewezen aan", key: "assigned", width: 22 },
        { header: "Laatste keuring", key: "last", width: 14 },
        { header: "Volgende keuring", key: "next", width: 16 },
    ];

    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0066FF" },
    };

    for (const r of rows) {
        sheet.addRow({
            code: r.code,
            category: categoryLabel(r.category),
            name: r.name,
            serial: r.serialNumber ?? "",
            status: statusLabel(r.status),
            bus: r.busKenteken ?? "",
            kantoor: r.kantoor ? "ja" : "nee",
            assigned: r.assignedName ?? "",
            last: r.lastInspectionAt?.toISOString().slice(0, 10) ?? "",
            next: r.nextInspectionAt?.toISOString().slice(0, 10) ?? "",
        });
    }

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
}
