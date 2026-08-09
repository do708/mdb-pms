import ExcelJS from "exceljs";

import { decimalToNumber } from "@/lib/projects/budget";
import { formatClockHours } from "@/types/oplever";

/** MDB logo-kleuren */
const BLUE = "FF0066FF";
const BLUE_DARK = "FF0A2540";
const BLUE_SOFT = "FFE8F0FF";
const PINK = "FFD6007E";
const PINK_SOFT = "FFFCE7F3";
const YELLOW = "FFFFCC00";
const YELLOW_SOFT = "FFFFF8DB";
const WHITE = "FFFFFFFF";
const DARK = "FF0A2540";
const MUTED = "FF64748B";

type ProjectExportInput = {
    number: string;
    name: string;
    location: string | null;
    plaats?: string | null;
    status: string;
    createdAt: Date;
    geoffreerdeUren: { toString(): string } | number | null;
    geoffreerdBedrag: { toString(): string } | number | null;
    customer: {
        name: string;
    };
    uren: {
        datum: Date;
        uren: { toString(): string } | number;
        kilometers: number | null;
        omschrijving: string | null;
        createdAt?: Date;
        user: {
            name: string | null;
            email: string;
        };
        bookedBy?: {
            name: string | null;
            email: string;
        } | null;
    }[];
    materialen: {
        omschrijving: string;
        factuurnummer: string | null;
        leverancier: string | null;
        kosten: { toString(): string } | number;
        ingekochtOp: Date | null;
    }[];
    workorders: {
        number: string;
        title: string;
        status: string;
    }[];
};

function formatDateNl(d: Date): string {
    return d.toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatDateTimeNl(d: Date): string {
    return d.toLocaleString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function statusLabel(status: string): string {
    const map: Record<string, string> = {
        actief: "Actief",
        new: "Nieuw",
        afgerond: "Afgerond",
        gearchiveerd: "Gearchiveerd",
    };
    return map[status] ?? status;
}

function monteurLabel(user: {
    name: string | null;
    email: string;
}): string {
    return user.name || user.email || "Onbekend";
}

function fill(cell: ExcelJS.Cell, argb: string) {
    cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb },
    };
}

function styleSection(cell: ExcelJS.Cell, color: string = BLUE) {
    cell.font = {
        bold: true,
        size: 12,
        color: { argb: WHITE },
        name: "Calibri",
    };
    fill(cell, color);
    cell.alignment = { vertical: "middle", horizontal: "left" };
}

function styleLabel(cell: ExcelJS.Cell) {
    cell.font = {
        bold: true,
        size: 10,
        color: { argb: BLUE_DARK },
        name: "Calibri",
    };
    fill(cell, BLUE_SOFT);
}

function styleValue(cell: ExcelJS.Cell) {
    cell.font = {
        size: 11,
        color: { argb: DARK },
        name: "Calibri",
    };
}

function styleHeaderRow(row: ExcelJS.Row) {
    row.eachCell((cell) => {
        cell.font = {
            bold: true,
            size: 10,
            color: { argb: WHITE },
            name: "Calibri",
        };
        fill(cell, BLUE);
        cell.alignment = {
            vertical: "middle",
            horizontal: "left",
        };
    });
    row.height = 22;
}

function styleAltRow(sheet: ExcelJS.Worksheet, row: number, cols: string[]) {
    for (const col of cols) {
        fill(sheet.getCell(`${col}${row}`), YELLOW_SOFT);
    }
}

function styleTotalRow(sheet: ExcelJS.Worksheet, row: number, cols: string[]) {
    for (const col of cols) {
        const cell = sheet.getCell(`${col}${row}`);
        cell.font = {
            bold: true,
            size: 11,
            color: { argb: PINK },
            name: "Calibri",
        };
        fill(cell, PINK_SOFT);
    }
}

function money(n: number): string {
    return n.toLocaleString("nl-NL", {
        style: "currency",
        currency: "EUR",
    });
}

function hoursDisplay(n: number): string {
    return formatClockHours(n) || "0";
}

export async function buildProjectExportWorkbook(
    project: ProjectExportInput
): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MDB Networks PMS";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Projectrapportage", {
        views: [{ showGridLines: false }],
        properties: { defaultRowHeight: 18 },
    });

    sheet.columns = [
        { key: "a", width: 14 },
        { key: "b", width: 22 },
        { key: "c", width: 10 },
        { key: "d", width: 12 },
        { key: "e", width: 22 },
        { key: "f", width: 18 },
        { key: "g", width: 28 },
    ];

    const gebruikteUren = project.uren.reduce(
        (sum, row) => sum + decimalToNumber(row.uren),
        0
    );
    const totaalKm = project.uren.reduce(
        (sum, row) => sum + (row.kilometers ?? 0),
        0
    );
    const materiaalKosten = project.materialen.reduce(
        (sum, row) => sum + decimalToNumber(row.kosten),
        0
    );
    const geoffreerd = decimalToNumber(project.geoffreerdeUren);
    const bedrag = decimalToNumber(project.geoffreerdBedrag);
    const restUren =
        geoffreerd > 0 ? Math.max(0, geoffreerd - gebruikteUren) : null;

    // --- Titel (blauw) + gele accentstreep ---
    sheet.mergeCells("A1:G1");
    const title = sheet.getCell("A1");
    title.value = "MDB Networks — Projectrapportage";
    title.font = {
        bold: true,
        size: 18,
        color: { argb: WHITE },
        name: "Calibri",
    };
    title.alignment = { vertical: "middle", horizontal: "left" };
    fill(title, BLUE);
    sheet.getRow(1).height = 38;

    sheet.mergeCells("A2:G2");
    const accent = sheet.getCell("A2");
    accent.value = "";
    fill(accent, YELLOW);
    sheet.getRow(2).height = 6;

    sheet.mergeCells("A3:G3");
    const subtitle = sheet.getCell("A3");
    subtitle.value = `${project.number}  ·  ${project.name}  ·  Geëxporteerd ${formatDateNl(new Date())}`;
    subtitle.font = {
        size: 10,
        color: { argb: BLUE_DARK },
        name: "Calibri",
    };
    fill(subtitle, BLUE_SOFT);
    sheet.getRow(3).height = 22;

    let row = 5;

    // --- Projectgegevens ---
    sheet.mergeCells(`A${row}:G${row}`);
    styleSection(sheet.getCell(`A${row}`), BLUE);
    sheet.getCell(`A${row}`).value = "Projectgegevens";
    sheet.getRow(row).height = 24;
    row += 1;

    const infoRows: [string, string][] = [
        ["Projectnummer", project.number],
        ["Projectnaam", project.name],
        ["Status", statusLabel(project.status)],
        [
            "Locatie",
            [project.location, project.plaats]
                .filter(Boolean)
                .join(", ") || "—",
        ],
        ["Aangemaakt", formatDateNl(project.createdAt)],
        ["Opdrachtgever", project.customer.name],
    ];

    for (const [label, value] of infoRows) {
        styleLabel(sheet.getCell(`A${row}`));
        sheet.getCell(`A${row}`).value = label;
        sheet.mergeCells(`B${row}:F${row}`);
        styleValue(sheet.getCell(`B${row}`));
        sheet.getCell(`B${row}`).value = value;
        row += 1;
    }

    row += 1;

    // --- Budget / totalen ---
    sheet.mergeCells(`A${row}:G${row}`);
    styleSection(sheet.getCell(`A${row}`), PINK);
    sheet.getCell(`A${row}`).value = "Overzicht uren & kosten";
    sheet.getRow(row).height = 24;
    row += 1;

    const summaryHeader = sheet.getRow(row);
    ["Onderdeel", "Waarde", "", "", "", ""].forEach((v, i) => {
        summaryHeader.getCell(i + 1).value = v;
    });
    styleHeaderRow(summaryHeader);
    row += 1;

    const summary: [string, string][] = [
        ["Geoffreerde uren", hoursDisplay(geoffreerd)],
        ["Gebruikte uren", hoursDisplay(gebruikteUren)],
        [
            "Restant uren",
            restUren != null ? hoursDisplay(restUren) : "—",
        ],
        ["Geoffreerd bedrag", bedrag > 0 ? money(bedrag) : "—"],
        ["Kilometers totaal", String(Math.round(totaalKm))],
        ["Materiaalkosten", money(materiaalKosten)],
        ["Urenregels", String(project.uren.length)],
        ["Materiaalregels", String(project.materialen.length)],
        ["Gekoppelde opdrachten", String(project.workorders.length)],
    ];

    let alt = false;
    for (const [label, value] of summary) {
        styleLabel(sheet.getCell(`A${row}`));
        sheet.getCell(`A${row}`).value = label;
        styleValue(sheet.getCell(`B${row}`));
        sheet.getCell(`B${row}`).value = value;
        if (alt) {
            fill(sheet.getCell(`B${row}`), YELLOW_SOFT);
        }
        alt = !alt;
        row += 1;
    }

    row += 1;

    // --- Uren per monteur ---
    sheet.mergeCells(`A${row}:G${row}`);
    styleSection(sheet.getCell(`A${row}`), BLUE);
    sheet.getCell(`A${row}`).value = "Uren per monteur";
    sheet.getRow(row).height = 24;
    row += 1;

    const perMonteur = new Map<
        string,
        { naam: string; uren: number; km: number; regels: number }
    >();

    for (const u of project.uren) {
        const naam = monteurLabel(u.user);
        const bestaand = perMonteur.get(naam) || {
            naam,
            uren: 0,
            km: 0,
            regels: 0,
        };
        bestaand.uren += decimalToNumber(u.uren);
        bestaand.km += u.kilometers ?? 0;
        bestaand.regels += 1;
        perMonteur.set(naam, bestaand);
    }

    const monteurHeader = sheet.getRow(row);
    ["Monteur", "Uren", "Kilometers", "Aantal regels", "", ""].forEach(
        (v, i) => {
            monteurHeader.getCell(i + 1).value = v;
        }
    );
    styleHeaderRow(monteurHeader);
    row += 1;

    const monteurRows = Array.from(perMonteur.values()).sort(
        (a, b) => b.uren - a.uren
    );

    if (monteurRows.length === 0) {
        sheet.getCell(`A${row}`).value = "Nog geen uren geboekt.";
        styleValue(sheet.getCell(`A${row}`));
        row += 1;
    } else {
        alt = false;
        for (const m of monteurRows) {
            sheet.getCell(`A${row}`).value = m.naam;
            sheet.getCell(`B${row}`).value = hoursDisplay(m.uren);
            sheet.getCell(`C${row}`).value = Math.round(m.km);
            sheet.getCell(`D${row}`).value = m.regels;
            ["A", "B", "C", "D"].forEach((col) =>
                styleValue(sheet.getCell(`${col}${row}`))
            );
            if (alt) {
                styleAltRow(sheet, row, ["A", "B", "C", "D"]);
            }
            alt = !alt;
            row += 1;
        }
    }

    row += 1;

    // --- Urenlog detail ---
    sheet.mergeCells(`A${row}:G${row}`);
    styleSection(sheet.getCell(`A${row}`), PINK);
    sheet.getCell(`A${row}`).value = "Urenlog";
    sheet.getRow(row).height = 24;
    row += 1;

    const urenHeader = sheet.getRow(row);
    [
        "Datum",
        "Monteur",
        "Uren",
        "Kilometers",
        "Geboekt door",
        "Geboekt op",
        "Omschrijving",
    ].forEach((v, i) => {
        urenHeader.getCell(i + 1).value = v;
    });
    styleHeaderRow(urenHeader);
    row += 1;

    if (project.uren.length === 0) {
        sheet.mergeCells(`A${row}:G${row}`);
        sheet.getCell(`A${row}`).value = "Geen urenregels.";
        styleValue(sheet.getCell(`A${row}`));
        row += 1;
    } else {
        alt = false;
        for (const u of project.uren) {
            const geboektDoor = u.bookedBy
                ? monteurLabel(u.bookedBy)
                : monteurLabel(u.user);
            sheet.getCell(`A${row}`).value = formatDateNl(u.datum);
            sheet.getCell(`B${row}`).value = monteurLabel(u.user);
            sheet.getCell(`C${row}`).value = hoursDisplay(
                decimalToNumber(u.uren)
            );
            sheet.getCell(`D${row}`).value =
                u.kilometers != null ? Math.round(u.kilometers) : "—";
            sheet.getCell(`E${row}`).value = geboektDoor;
            sheet.getCell(`F${row}`).value = u.createdAt
                ? formatDateTimeNl(u.createdAt)
                : "—";
            sheet.getCell(`G${row}`).value = u.omschrijving || "—";
            ["A", "B", "C", "D", "E", "F", "G"].forEach((col) =>
                styleValue(sheet.getCell(`${col}${row}`))
            );
            if (alt) {
                styleAltRow(sheet, row, ["A", "B", "C", "D", "E", "F", "G"]);
            }
            alt = !alt;
            row += 1;
        }

        sheet.getCell(`A${row}`).value = "Totaal";
        sheet.getCell(`B${row}`).value = "";
        sheet.getCell(`C${row}`).value = hoursDisplay(gebruikteUren);
        sheet.getCell(`D${row}`).value = Math.round(totaalKm);
        styleTotalRow(sheet, row, ["A", "B", "C", "D"]);
        row += 1;
    }

    row += 1;

    // --- Materialen ---
    sheet.mergeCells(`A${row}:G${row}`);
    styleSection(sheet.getCell(`A${row}`), BLUE);
    sheet.getCell(`A${row}`).value = "Materialen";
    sheet.getRow(row).height = 24;
    row += 1;

    const matHeader = sheet.getRow(row);
    [
        "Omschrijving",
        "Leverancier",
        "Factuurnummer",
        "Kosten",
        "Ingekocht",
        "",
    ].forEach((v, i) => {
        matHeader.getCell(i + 1).value = v;
    });
    styleHeaderRow(matHeader);
    row += 1;

    if (project.materialen.length === 0) {
        sheet.mergeCells(`A${row}:G${row}`);
        sheet.getCell(`A${row}`).value = "Geen materialen.";
        styleValue(sheet.getCell(`A${row}`));
        row += 1;
    } else {
        alt = false;
        for (const m of project.materialen) {
            sheet.getCell(`A${row}`).value = m.omschrijving;
            sheet.getCell(`B${row}`).value = m.leverancier || "—";
            sheet.getCell(`C${row}`).value = m.factuurnummer || "—";
            sheet.getCell(`D${row}`).value = money(
                decimalToNumber(m.kosten)
            );
            sheet.getCell(`E${row}`).value = m.ingekochtOp
                ? formatDateNl(m.ingekochtOp)
                : "—";
            ["A", "B", "C", "D", "E"].forEach((col) =>
                styleValue(sheet.getCell(`${col}${row}`))
            );
            if (alt) {
                styleAltRow(sheet, row, ["A", "B", "C", "D", "E"]);
            }
            alt = !alt;
            row += 1;
        }

        sheet.getCell(`A${row}`).value = "Totaal materiaalkosten";
        sheet.mergeCells(`B${row}:C${row}`);
        sheet.getCell(`D${row}`).value = money(materiaalKosten);
        styleTotalRow(sheet, row, ["A", "B", "C", "D"]);
        row += 1;
    }

    row += 1;

    // --- Opdrachten ---
    sheet.mergeCells(`A${row}:G${row}`);
    styleSection(sheet.getCell(`A${row}`), PINK);
    sheet.getCell(`A${row}`).value = "Gekoppelde opdrachten";
    sheet.getRow(row).height = 24;
    row += 1;

    const woHeader = sheet.getRow(row);
    ["Nummer", "Titel", "Status", "", "", ""].forEach((v, i) => {
        woHeader.getCell(i + 1).value = v;
    });
    styleHeaderRow(woHeader);
    row += 1;

    if (project.workorders.length === 0) {
        sheet.getCell(`A${row}`).value = "Geen gekoppelde opdrachten.";
        styleValue(sheet.getCell(`A${row}`));
        row += 1;
    } else {
        alt = false;
        for (const w of project.workorders) {
            sheet.getCell(`A${row}`).value = w.number;
            sheet.getCell(`B${row}`).value = w.title;
            sheet.getCell(`C${row}`).value = w.status;
            ["A", "B", "C"].forEach((col) =>
                styleValue(sheet.getCell(`${col}${row}`))
            );
            if (alt) {
                styleAltRow(sheet, row, ["A", "B", "C"]);
            }
            alt = !alt;
            row += 1;
        }
    }

    row += 2;
    sheet.mergeCells(`A${row}:G${row}`);
    const footer = sheet.getCell(`A${row}`);
    footer.value =
        "MDB Networks PMS · Vertrouwelijk · Alleen voor intern gebruik";
    footer.font = {
        size: 9,
        color: { argb: MUTED },
        italic: true,
        name: "Calibri",
    };

    // Gele footer-accent
    row += 1;
    sheet.mergeCells(`A${row}:G${row}`);
    fill(sheet.getCell(`A${row}`), YELLOW);
    sheet.getRow(row).height = 4;

    return workbook.xlsx.writeBuffer();
}
