// Schoolvakanties regio Noord (OCW) en bouwvak Noord (advies).
// Officiële datums tot en met schooljaar 2029–2030; daarna een vaste
// week-heuristiek zodat 2031+ blijft doorlopen.

export type VacationKind = "schoolvakantie" | "bouwvak";

export type VacationPeriod = {
    from: string;
    to: string;
    name: string;
    shortName: string;
    kind: VacationKind;
};

function pad(n: number): string {
    return String(n).padStart(2, "0");
}

function toIso(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function atNoon(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function addDays(d: Date, n: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

function saturdayOnOrBefore(d: Date): Date {
    const dow = d.getDay();
    const back = (dow + 1) % 7;
    return addDays(d, -back);
}

function sundayOnOrAfter(d: Date): Date {
    const dow = d.getDay();
    if (dow === 0) return new Date(d);
    return addDays(d, 7 - dow);
}

/** Maandag van ISO-week `week` in kalenderjaar `year`. */
function isoWeekMonday(year: number, week: number): Date {
    const jan4 = atNoon(year, 1, 4);
    const jan4Dow = jan4.getDay() || 7;
    const mondayWeek1 = addDays(jan4, 1 - jan4Dow);
    return addDays(mondayWeek1, (week - 1) * 7);
}

function saturdayOfIsoWeek(year: number, week: number): Date {
    return addDays(isoWeekMonday(year, week), 5);
}

function period(
    from: string,
    to: string,
    shortName: string,
    kind: VacationKind,
    name: string
): VacationPeriod {
    return { from, to, name, shortName, kind };
}

function school(
    from: string,
    to: string,
    shortName: string,
    name: string
): VacationPeriod {
    return period(from, to, shortName, "schoolvakantie", name);
}

function bouwvak(from: string, to: string): VacationPeriod {
    return period(from, to, "Bouwvak", "bouwvak", "Bouwvak Noord");
}

/**
 * Schooljaar-startjaar → periodes regio Noord.
 * Bron: Rijksoverheid / Regeling vaststelling schoolvakanties 2025–2030.
 */
const OFFICIAL_SCHOOL_YEARS: Record<number, VacationPeriod[]> = {
    2025: [
        school("2025-10-18", "2025-10-26", "Herfstvakantie", "Herfstvakantie Noord"),
        school("2025-12-20", "2026-01-04", "Kerstvakantie", "Kerstvakantie"),
        school("2026-02-21", "2026-03-01", "Voorjaarsvakantie", "Voorjaarsvakantie Noord"),
        school("2026-04-25", "2026-05-03", "Meivakantie", "Meivakantie"),
        school("2026-07-04", "2026-08-16", "Zomervakantie", "Zomervakantie Noord"),
    ],
    2026: [
        school("2026-10-10", "2026-10-18", "Herfstvakantie", "Herfstvakantie Noord"),
        school("2026-12-19", "2027-01-03", "Kerstvakantie", "Kerstvakantie"),
        school("2027-02-20", "2027-02-28", "Voorjaarsvakantie", "Voorjaarsvakantie Noord"),
        school("2027-04-24", "2027-05-02", "Meivakantie", "Meivakantie"),
        school("2027-07-10", "2027-08-22", "Zomervakantie", "Zomervakantie Noord"),
    ],
    2027: [
        school("2027-10-16", "2027-10-24", "Herfstvakantie", "Herfstvakantie Noord"),
        school("2027-12-25", "2028-01-09", "Kerstvakantie", "Kerstvakantie"),
        school("2028-02-19", "2028-02-27", "Voorjaarsvakantie", "Voorjaarsvakantie Noord"),
        school("2028-04-29", "2028-05-07", "Meivakantie", "Meivakantie"),
        school("2028-07-15", "2028-08-27", "Zomervakantie", "Zomervakantie Noord"),
    ],
    2028: [
        school("2028-10-14", "2028-10-22", "Herfstvakantie", "Herfstvakantie Noord"),
        school("2028-12-23", "2029-01-07", "Kerstvakantie", "Kerstvakantie"),
        school("2029-02-17", "2029-02-25", "Voorjaarsvakantie", "Voorjaarsvakantie Noord"),
        school("2029-04-28", "2029-05-06", "Meivakantie", "Meivakantie"),
        school("2029-07-21", "2029-09-02", "Zomervakantie", "Zomervakantie Noord"),
    ],
    2029: [
        school("2029-10-20", "2029-10-28", "Herfstvakantie", "Herfstvakantie Noord"),
        school("2029-12-22", "2030-01-06", "Kerstvakantie", "Kerstvakantie"),
        school("2030-02-16", "2030-02-24", "Voorjaarsvakantie", "Voorjaarsvakantie Noord"),
        school("2030-04-27", "2030-05-05", "Meivakantie", "Meivakantie"),
        school("2030-07-20", "2030-09-01", "Zomervakantie", "Zomervakantie Noord"),
    ],
};

/** Adviesdata bouwvak Noord (geen wettelijke sluiting). */
const OFFICIAL_BOUWVAK: Record<number, VacationPeriod> = {
    2026: bouwvak("2026-07-18", "2026-08-08"),
    2027: bouwvak("2027-07-24", "2027-08-15"),
    2028: bouwvak("2028-07-29", "2028-08-20"),
};

function generateSchoolYear(startYear: number): VacationPeriod[] {
    const herfstStart = saturdayOfIsoWeek(startYear, 42);
    const christmas = atNoon(startYear, 12, 25);
    const kerstStart = saturdayOnOrBefore(christmas);
    const next = startYear + 1;
    const voorjaarStart = saturdayOfIsoWeek(next, 8);
    const meiEnd = sundayOnOrAfter(atNoon(next, 5, 5));
    const meiStart = addDays(meiEnd, -8);
    const zomerStart = saturdayOfIsoWeek(next, 28);

    return [
        school(
            toIso(herfstStart),
            toIso(addDays(herfstStart, 8)),
            "Herfstvakantie",
            "Herfstvakantie Noord"
        ),
        school(
            toIso(kerstStart),
            toIso(addDays(kerstStart, 15)),
            "Kerstvakantie",
            "Kerstvakantie"
        ),
        school(
            toIso(voorjaarStart),
            toIso(addDays(voorjaarStart, 8)),
            "Voorjaarsvakantie",
            "Voorjaarsvakantie Noord"
        ),
        school(toIso(meiStart), toIso(meiEnd), "Meivakantie", "Meivakantie"),
        school(
            toIso(zomerStart),
            toIso(addDays(zomerStart, 43)),
            "Zomervakantie",
            "Zomervakantie Noord"
        ),
    ];
}

function generateBouwvak(year: number): VacationPeriod {
    const monday = isoWeekMonday(year, 30);
    const from = addDays(monday, -2);
    const fridayWeek32 = addDays(isoWeekMonday(year, 32), 4);
    const to = addDays(fridayWeek32, 2);
    return bouwvak(toIso(from), toIso(to));
}

function schoolPeriodsForSchoolYear(startYear: number): VacationPeriod[] {
    return OFFICIAL_SCHOOL_YEARS[startYear] ?? generateSchoolYear(startYear);
}

function bouwvakForYear(year: number): VacationPeriod {
    return OFFICIAL_BOUWVAK[year] ?? generateBouwvak(year);
}

function rangesOverlap(
    aFrom: string,
    aTo: string,
    bFrom: string,
    bTo: string
): boolean {
    return aFrom <= bTo && aTo >= bFrom;
}

export function eachIsoInRange(from: string, to: string): string[] {
    const out: string[] = [];
    const cur = new Date(from + "T12:00:00");
    const end = new Date(to + "T12:00:00");
    while (cur <= end) {
        out.push(toIso(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}

/** Alle vakantieperiodes (Noord + bouwvak) die het interval raken. */
export function periodsOverlapping(
    fromIso: string,
    toIso: string
): VacationPeriod[] {
    const fromY = Number(fromIso.slice(0, 4));
    const toY = Number(toIso.slice(0, 4));
    const out: VacationPeriod[] = [];

    for (let schoolYear = fromY - 1; schoolYear <= toY; schoolYear++) {
        out.push(...schoolPeriodsForSchoolYear(schoolYear));
    }
    for (let year = fromY; year <= toY; year++) {
        out.push(bouwvakForYear(year));
    }

    return out.filter((p) => rangesOverlap(p.from, p.to, fromIso, toIso));
}
