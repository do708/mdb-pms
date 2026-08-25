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

export function periodRange(
    preset: PeriodPreset,
    customMonth: string
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
        return yearRange(Number(today.slice(0, 4)));
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
    metric: "Uren" | "Reistijd" | "Kilometers",
    preset: PeriodPreset,
    customMonth: string
): string {
    if (preset === "all") {
        return `${metric} totaal`;
    }
    if (preset === "day") {
        return `${metric} vandaag`;
    }
    if (preset === "week") {
        return `${metric} deze week`;
    }
    if (preset === "month") {
        return `${metric} deze maand`;
    }
    if (preset === "year") {
        return `${metric} dit jaar`;
    }
    if (customMonth) {
        return `${metric} ${formatMonthLabel(customMonth)}`;
    }
    return metric;
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

export function engineersFromTimeline(rows: ReportDayRow[]): {
    id: string;
    name: string;
}[] {
    const map = new Map<string, string>();
    for (const row of rows) {
        if (!map.has(row.engineerId)) {
            map.set(row.engineerId, row.engineerName);
        }
    }
    return [...map.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export function engineersTotals(rows: ReportDayRow[]): {
    id: string;
    name: string;
    hours: number;
    travel: number;
    kilometers: number;
}[] {
    const map = new Map<
        string,
        {
            id: string;
            name: string;
            hours: number;
            travel: number;
            kilometers: number;
        }
    >();

    for (const row of rows) {
        const existing = map.get(row.engineerId) || {
            id: row.engineerId,
            name: row.engineerName,
            hours: 0,
            travel: 0,
            kilometers: 0,
        };
        existing.hours += row.hours;
        existing.travel += row.travel;
        existing.kilometers += row.kilometers;
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
