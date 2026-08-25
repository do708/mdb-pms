import { holidayMap } from "@/lib/holidays";
import {
    eachIsoInRange,
    periodsOverlapping,
    type VacationKind,
} from "@/lib/schoolVacations";

export type VacationMark = {
    name: string;
    shortName: string;
    kind: VacationKind;
};

export type DayMarks = {
    holiday: string | null;
    vacations: VacationMark[];
};

export const EMPTY_DAY_MARKS: DayMarks = {
    holiday: null,
    vacations: [],
};

export function yearsAround(dates: Date[]): number[] {
    const years = new Set<number>();
    for (const d of dates) {
        const y = d.getFullYear();
        years.add(y - 1);
        years.add(y);
        years.add(y + 1);
    }
    return [...years].sort((a, b) => a - b);
}

export function buildDayMarksLookup(years: number[]): Record<string, DayMarks> {
    if (years.length === 0) return {};

    const min = Math.min(...years);
    const max = Math.max(...years);
    const from = `${min}-01-01`;
    const to = `${max}-12-31`;

    const holidays = holidayMap(years);
    const vacByDate: Record<string, VacationMark[]> = {};

    for (const p of periodsOverlapping(from, to)) {
        const mark: VacationMark = {
            name: p.name,
            shortName: p.shortName,
            kind: p.kind,
        };
        for (const iso of eachIsoInRange(p.from, p.to)) {
            const list = vacByDate[iso] ?? (vacByDate[iso] = []);
            if (!list.some((v) => v.kind === mark.kind && v.name === mark.name)) {
                list.push(mark);
            }
        }
    }

    const keys = new Set([
        ...Object.keys(holidays),
        ...Object.keys(vacByDate),
    ]);
    const out: Record<string, DayMarks> = {};
    for (const iso of keys) {
        out[iso] = {
            holiday: holidays[iso] ?? null,
            vacations: vacByDate[iso] ?? [],
        };
    }
    return out;
}

export function marksOn(
    iso: string,
    lookup: Record<string, DayMarks>
): DayMarks {
    return lookup[iso] ?? EMPTY_DAY_MARKS;
}

export function vacationToneClass(vacations: VacationMark[]): string {
    if (vacations.some((v) => v.kind === "bouwvak")) {
        return "border-amber-200/90 bg-amber-50/50";
    }
    if (vacations.some((v) => v.kind === "schoolvakantie")) {
        return "border-sky-200/90 bg-sky-50/50";
    }
    return "";
}

export function vacationChipClass(kind: VacationKind): string {
    if (kind === "bouwvak") {
        return "text-amber-800 bg-amber-100/80";
    }
    return "text-sky-800 bg-sky-100/80";
}
