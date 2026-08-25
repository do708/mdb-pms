/** Kalenderdagen in Europe/Amsterdam (rapportage-periodes). */

const TZ = "Europe/Amsterdam";

export type PeriodPreset =
    | "all"
    | "day"
    | "week"
    | "month"
    | "year"
    | "custom";

export type GroupBy = "day" | "week" | "month";

export type ReportCustomerHours = {
    id: string;
    name: string;
    hours: number;
};

export type ReportDayRow = {
    date: string;
    engineerId: string;
    engineerName: string;
    staffKind?: string;
    hours: number;
    travel: number;
    kilometers: number;
    customers: ReportCustomerHours[];
};

export type GroupedPeriodRow = {
    key: string;
    label: string;
    hours: number;
    travel: number;
    kilometers: number;
};

export type ReportLeaveRange = {
    userId: string;
    userName: string;
    from: string;
    to: string;
};

export type YearMonthFilter = {
    year: number;
    month: string;
};

export type EngineerPeriodTotals = {
    id: string;
    name: string;
    staffKind?: string;
    hours: number;
    travel: number;
    kilometers: number;
    leaveDays: number;
};

export const MONTH_FILTER_OPTIONS: { value: string; label: string }[] = [
    { value: "", label: "Hele jaar" },
    { value: "01", label: "januari" },
    { value: "02", label: "februari" },
    { value: "03", label: "maart" },
    { value: "04", label: "april" },
    { value: "05", label: "mei" },
    { value: "06", label: "juni" },
    { value: "07", label: "juli" },
    { value: "08", label: "augustus" },
    { value: "09", label: "september" },
    { value: "10", label: "oktober" },
    { value: "11", label: "november" },
    { value: "12", label: "december" },
];

/** YYYY-MM-DD in Amsterdam. */
export function amsterdamDateKey(date: Date): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

export function todayKey(): string {
    return amsterdamDateKey(new Date());
}

export function addDays(dateKey: string, days: number): string {
    const [year, month, day] = dateKey.split("-").map(Number);
    const utc = Date.UTC(year, month - 1, day) + days * 86400000;
    return new Date(utc).toISOString().slice(0, 10);
}

/** Maandag van de ISO-week (ma–zo). */
export function startOfIsoWeek(dateKey: string): string {
    const [year, month, day] = dateKey.split("-").map(Number);
    const utc = Date.UTC(year, month - 1, day);
    const weekday = new Date(utc).getUTCDay();
    const offset = (weekday + 6) % 7;
    return addDays(dateKey, -offset);
}

export function monthKeyFromDate(dateKey: string): string {
    return dateKey.slice(0, 7);
}

export function monthRange(monthKey: string): { from: string; to: string } {
    const [year, month] = monthKey.split("-").map(Number);
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return {
        from: `${monthKey}-01`,
        to: `${monthKey}-${String(last).padStart(2, "0")}`,
    };
}

export function yearRange(year: number): { from: string; to: string } {
    return {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
    };
}

export function toDateKey(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/** Werkdagen (ma–vr) in het overlap van verlof en rapportageperiode. */
export function countWeekdaysInclusive(
    fromKey: string,
    toKey: string,
    range: { from: string; to: string } | null
): number {
    let from = fromKey;
    let to = toKey < fromKey ? fromKey : toKey;

    if (range) {
        if (from < range.from) {
            from = range.from;
        }
        if (to > range.to) {
            to = range.to;
        }
    }

    if (from > to) {
        return 0;
    }

    let count = 0;
    for (let day = from; day <= to; day = addDays(day, 1)) {
        const [year, month, date] = day.split("-").map(Number);
        const weekday = new Date(Date.UTC(year, month - 1, date)).getUTCDay();
        if (weekday !== 0 && weekday !== 6) {
            count += 1;
        }
    }
    return count;
}

export function periodRange(
    preset: PeriodPreset,
    customMonth: string,
    yearFilter?: YearMonthFilter
): { from: string; to: string } | null {
    const today = todayKey();

    if (preset === "all") {
        return null;
    }
    if (preset === "day") {
        return { from: today, to: today };
    }
    if (preset === "week") {
        const from = startOfIsoWeek(today);
        return { from, to: addDays(from, 6) };
    }
    if (preset === "month") {
        return monthRange(monthKeyFromDate(today));
    }
    if (preset === "year") {
        const year = yearFilter?.year ?? Number(today.slice(0, 4));
        const month = yearFilter?.month ?? "";
        if (month && /^\d{2}$/.test(month)) {
            return monthRange(`${year}-${month}`);
        }
        return yearRange(year);
    }
    if (customMonth && /^\d{4}-\d{2}$/.test(customMonth)) {
        return monthRange(customMonth);
    }
    return monthRange(monthKeyFromDate(today));
}

export function inDateRange(
    dateKey: string,
    range: { from: string; to: string } | null
): boolean {
    if (!range) {
        return true;
    }
    return dateKey >= range.from && dateKey <= range.to;
}

export function formatDayLabel(dateKey: string): string {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("nl-NL", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function formatWeekLabel(mondayKey: string): string {
    const sundayKey = addDays(mondayKey, 6);
    const from = formatDayLabel(mondayKey);
    const to = formatDayLabel(sundayKey);
    return `${from} – ${to}`;
}

export function formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("nl-NL", {
        month: "long",
        year: "numeric",
    });
}

export function periodStatLabel(
    metric: "Uren" | "Reistijd" | "Kilometers" | "Verlof",
    preset: PeriodPreset,
    customMonth: string,
    yearFilter?: YearMonthFilter
): string {
    const suffix = (text: string) =>
        metric === "Verlof" ? `Verlofdagen ${text}` : `${metric} ${text}`;

    if (preset === "all") {
        return metric === "Verlof" ? "Verlofdagen totaal" : `${metric} totaal`;
    }
    if (preset === "day") {
        return suffix("vandaag");
    }
    if (preset === "week") {
        return suffix("deze week");
    }
    if (preset === "month") {
        return suffix("deze maand");
    }
    if (preset === "year") {
        const year = yearFilter?.year ?? Number(todayKey().slice(0, 4));
        const month = yearFilter?.month ?? "";
        if (month && /^\d{2}$/.test(month)) {
            return suffix(formatMonthLabel(`${year}-${month}`));
        }
        return suffix(String(year));
    }
    if (customMonth) {
        return suffix(formatMonthLabel(customMonth));
    }
    return metric === "Verlof" ? "Verlofdagen" : metric;
}

export function filterTimeline(
    rows: ReportDayRow[],
    engineerId: string,
    range: { from: string; to: string } | null
): ReportDayRow[] {
    return rows.filter((row) => {
        if (engineerId !== "alle" && row.engineerId !== engineerId) {
            return false;
        }
        return inDateRange(row.date, range);
    });
}

export function groupTimeline(
    rows: ReportDayRow[],
    groupBy: GroupBy
): GroupedPeriodRow[] {
    const map = new Map<string, GroupedPeriodRow>();

    for (const row of rows) {
        let key: string;
        let label: string;

        if (groupBy === "day") {
            key = row.date;
            label = formatDayLabel(row.date);
        } else if (groupBy === "week") {
            key = startOfIsoWeek(row.date);
            label = formatWeekLabel(key);
        } else {
            key = monthKeyFromDate(row.date);
            label = formatMonthLabel(key);
        }

        const existing = map.get(key) || {
            key,
            label,
            hours: 0,
            travel: 0,
            kilometers: 0,
        };

        existing.hours += row.hours;
        existing.travel += row.travel;
        existing.kilometers += row.kilometers;
        map.set(key, existing);
    }

    return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

export function timelineTotals(rows: ReportDayRow[]): {
    hours: number;
    travel: number;
    kilometers: number;
} {
    return rows.reduce(
        (acc, row) => {
            acc.hours += row.hours;
            acc.travel += row.travel;
            acc.kilometers += row.kilometers;
            return acc;
        },
        { hours: 0, travel: 0, kilometers: 0 }
    );
}

export function engineersFromSources(
    rows: ReportDayRow[],
    leave: ReportLeaveRange[]
): {
    id: string;
    name: string;
}[] {
    const map = new Map<string, string>();
    for (const row of rows) {
        if (!map.has(row.engineerId)) {
            map.set(row.engineerId, row.engineerName);
        }
    }
    for (const item of leave) {
        if (!map.has(item.userId)) {
            map.set(item.userId, item.userName);
        }
    }
    return [...map.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export function availableYears(
    rows: ReportDayRow[],
    leave: ReportLeaveRange[]
): number[] {
    const years = new Set<number>();
    years.add(Number(todayKey().slice(0, 4)));
    for (const row of rows) {
        years.add(Number(row.date.slice(0, 4)));
    }
    for (const item of leave) {
        years.add(Number(item.from.slice(0, 4)));
        years.add(Number(item.to.slice(0, 4)));
    }
    return [...years]
        .filter((year) => Number.isFinite(year) && year > 2000)
        .sort((a, b) => b - a);
}

export function leaveDaysByEngineer(
    leave: ReportLeaveRange[],
    engineerId: string,
    range: { from: string; to: string } | null
): Map<string, { name: string; days: number }> {
    const map = new Map<string, { name: string; days: number }>();

    for (const item of leave) {
        if (engineerId !== "alle" && item.userId !== engineerId) {
            continue;
        }
        const days = countWeekdaysInclusive(item.from, item.to, range);
        if (days <= 0) {
            continue;
        }
        const existing = map.get(item.userId) || {
            name: item.userName,
            days: 0,
        };
        existing.days += days;
        map.set(item.userId, existing);
    }

    return map;
}

export function engineersTotalsWithLeave(
    rows: ReportDayRow[],
    leave: ReportLeaveRange[],
    engineerId: string,
    range: { from: string; to: string } | null
): EngineerPeriodTotals[] {
    const hours = engineersTotals(rows);
    const leaveMap = leaveDaysByEngineer(leave, engineerId, range);
    const map = new Map<string, EngineerPeriodTotals>();

    for (const row of hours) {
        map.set(row.id, {
            ...row,
            leaveDays: leaveMap.get(row.id)?.days ?? 0,
        });
    }

    for (const [id, item] of leaveMap) {
        if (map.has(id)) {
            continue;
        }
        map.set(id, {
            id,
            name: item.name,
            staffKind: undefined,
            hours: 0,
            travel: 0,
            kilometers: 0,
            leaveDays: item.days,
        });
    }

    return [...map.values()].sort((a, b) => {
        if (b.hours !== a.hours) {
            return b.hours - a.hours;
        }
        return a.name.localeCompare(b.name, "nl");
    });
}

export function engineersTotals(rows: ReportDayRow[]): {
    id: string;
    name: string;
    staffKind?: string;
    hours: number;
    travel: number;
    kilometers: number;
}[] {
    const map = new Map<
        string,
        {
            id: string;
            name: string;
            staffKind?: string;
            hours: number;
            travel: number;
            kilometers: number;
        }
    >();

    for (const row of rows) {
        const existing = map.get(row.engineerId) || {
            id: row.engineerId,
            name: row.engineerName,
            staffKind: row.staffKind,
            hours: 0,
            travel: 0,
            kilometers: 0,
        };
        existing.hours += row.hours;
        existing.travel += row.travel;
        existing.kilometers += row.kilometers;
        if (!existing.staffKind && row.staffKind) {
            existing.staffKind = row.staffKind;
        }
        map.set(row.engineerId, existing);
    }

    return [...map.values()].sort((a, b) => b.hours - a.hours);
}

export function customersTotals(rows: ReportDayRow[]): {
    id: string;
    name: string;
    hours: number;
}[] {
    const map = new Map<string, { id: string; name: string; hours: number }>();

    for (const row of rows) {
        for (const customer of row.customers) {
            const existing = map.get(customer.id) || {
                id: customer.id,
                name: customer.name,
                hours: 0,
            };
            existing.hours += customer.hours;
            map.set(customer.id, existing);
        }
    }

    return [...map.values()].sort((a, b) => b.hours - a.hours);
}
