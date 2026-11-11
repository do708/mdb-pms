import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { holidayMap } from "@/lib/holidays";
import { loadMdbLogoPng, MDB_NAVY, MDB_PINK } from "@/lib/pdf/mdbBrand";
import type { TakenLeaveDay, VacationBalance } from "@/lib/reports/vacation";

const HOLIDAY_FILL = rgb(0.25, 0.72, 0.82);
const OTHER_LEAVE = rgb(1, 0.7, 0.35);

const MONTHS = [
    "Januari",
    "Februari",
    "Maart",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Augustus",
    "September",
    "Oktober",
    "November",
    "December",
];

const WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

function monthCells(year: number, month: number): (number | null)[] {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const offset = (first.getUTCDay() + 6) % 7;
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i += 1) {
        cells.push(null);
    }
    for (let day = 1; day <= last; day += 1) {
        cells.push(day);
    }
    while (cells.length % 7 !== 0) {
        cells.push(null);
    }
    return cells;
}

function dateKey(year: number, month: number, day: number): string {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
}

export async function generateVacationOverviewPdf(args: {
    year: number;
    name: string;
    balance: VacationBalance;
    taken: TakenLeaveDay[];
}): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const headerX = 32;
    let nameX = headerX;
    const nameY = 802;

    try {
        const logo = await pdf.embedPng(loadMdbLogoPng());
        const logoH = 22;
        const logoW = (logo.width / logo.height) * logoH;
        page.drawImage(logo, {
            x: headerX,
            y: nameY - 4,
            width: logoW,
            height: logoH,
        });
        nameX = headerX + logoW + 10;
    } catch {
        /* logo optioneel */
    }

    page.drawText(`${args.name} · ${args.year}`, {
        x: nameX,
        y: nameY,
        size: 13,
        font: bold,
        color: MDB_NAVY,
    });

    const saldoY = nameY - 28;
    const usedLabel = args.balance.used.toLocaleString("nl-NL", {
        maximumFractionDigits: 2,
    });
    const remainingLabel = args.balance.remaining.toLocaleString("nl-NL", {
        maximumFractionDigits: 2,
    });
    const carry =
        args.balance.remainingFromPreviousYear > 0
            ? ` (waarvan ${args.balance.remainingFromPreviousYear.toLocaleString("nl-NL", { maximumFractionDigits: 2 })} meegenomen)`
            : "";
    const saldo = `${usedLabel} opgenomen van ${args.balance.entitled}${carry} · ${remainingLabel} over`;
    page.drawText(saldo, {
        x: headerX,
        y: saldoY,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.25),
    });

    const legendX = headerX + font.widthOfTextAtSize(saldo, 10) + 16;
    page.drawRectangle({
        x: legendX,
        y: saldoY,
        width: 7,
        height: 7,
        color: MDB_PINK,
    });
    page.drawText("Vakantiedag", {
        x: legendX + 10,
        y: saldoY,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.35),
    });
    page.drawRectangle({
        x: legendX + 78,
        y: saldoY,
        width: 7,
        height: 7,
        color: OTHER_LEAVE,
    });
    page.drawText("Ander verlof", {
        x: legendX + 88,
        y: saldoY,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.35),
    });
    page.drawRectangle({
        x: legendX + 154,
        y: saldoY,
        width: 7,
        height: 7,
        color: HOLIDAY_FILL,
    });
    page.drawText("Feestdag", {
        x: legendX + 164,
        y: saldoY,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.35),
    });

    const takenMap = new Map(args.taken.map((day) => [day.date, day]));
    const holidays = holidayMap([args.year]);

    const marginX = 28;
    const top = saldoY - 16;
    const bottom = 28;
    const cols = 3;
    const rows = 4;
    const gapX = 10;
    const gapY = 10;
    const boxW = (595.28 - marginX * 2 - gapX * (cols - 1)) / cols;
    const boxH = (top - bottom - gapY * (rows - 1)) / rows;

    for (let month = 1; month <= 12; month += 1) {
        const col = (month - 1) % cols;
        const row = Math.floor((month - 1) / cols);
        const x = marginX + col * (boxW + gapX);
        const y = top - (row + 1) * boxH - row * gapY;

        page.drawRectangle({
            x,
            y,
            width: boxW,
            height: boxH,
            color: rgb(0.97, 0.97, 0.98),
            borderColor: rgb(0.85, 0.87, 0.9),
            borderWidth: 0.6,
        });

        page.drawText(MONTHS[month - 1], {
            x: x + 6,
            y: y + boxH - 14,
            size: 9,
            font: bold,
            color: MDB_NAVY,
        });

        const cellW = (boxW - 12) / 7;
        const headerY = y + boxH - 26;
        WEEKDAYS.forEach((label, i) => {
            page.drawText(label, {
                x: x + 6 + i * cellW + 2,
                y: headerY,
                size: 6,
                font,
                color: i >= 5 ? rgb(0.65, 0.65, 0.7) : rgb(0.4, 0.4, 0.45),
            });
        });

        const cells = monthCells(args.year, month);
        const weeks = cells.length / 7;
        const gridTop = headerY - 4;
        const gridH = gridTop - (y + 6);
        const cellH = gridH / weeks;

        cells.forEach((day, index) => {
            if (day == null) {
                return;
            }
            const c = index % 7;
            const r = Math.floor(index / 7);
            const cx = x + 6 + c * cellW;
            const cy = gridTop - (r + 1) * cellH;
            const key = dateKey(args.year, month, day);
            const taken = takenMap.get(key);
            const weekend = c >= 5;
            const isHoliday = Boolean(holidays[key]);
            const cellWFill = Math.max(cellW - 2, 4);
            const cellHFill = Math.max(cellH - 2, 6);

            if (taken) {
                page.drawRectangle({
                    x: cx + 1,
                    y: cy + 1,
                    width: cellWFill,
                    height: cellHFill,
                    color: taken.isVacation ? MDB_PINK : OTHER_LEAVE,
                    ...(isHoliday
                        ? {
                              borderColor: HOLIDAY_FILL,
                              borderWidth: 1.2,
                          }
                        : {}),
                });
            } else if (isHoliday) {
                page.drawRectangle({
                    x: cx + 1,
                    y: cy + 1,
                    width: cellWFill,
                    height: cellHFill,
                    color: HOLIDAY_FILL,
                });
            }

            const label = String(day);
            const textW = font.widthOfTextAtSize(label, 7);
            page.drawText(label, {
                x: cx + (cellW - textW) / 2,
                y: cy + Math.max((cellH - 7) / 2, 1),
                size: 7,
                font: taken ? bold : font,
                color: taken || isHoliday
                    ? rgb(1, 1, 1)
                    : weekend
                      ? rgb(0.65, 0.65, 0.7)
                      : rgb(0.15, 0.15, 0.2),
            });
        });
    }

    return pdf.save();
}
