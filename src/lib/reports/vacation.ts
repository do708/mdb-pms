import {
    countWeekdaysInclusive,
    leaveWorkdayKeys,
    todayKey,
    toDateKey,
    type EngineerPeriodTotals,
    type PeriodPreset,
    type YearMonthFilter,
} from "@/lib/reports/periods";

export const VACATION_DAYS_PER_YEAR = 31;
export const HOURS_PER_VACATION_DAY = 8;

export type VacationLeaveItem = {
    userId: string;
    userName: string;
    from: string;
    to: string;
    type?: string | null;
    reden?: string | null;
    totaalUren?: number | null;
    status?: string | null;
};

export type VacationBalance = {
    userId: string;
    name: string;
    year: number;
    entitled: number;
    used: number;
    remaining: number;
    pending: number;
    remainingFromPreviousYear: number;
};

export function isVakantiedagen(type: unknown): boolean {
    if (typeof type !== "string") {
        return false;
    }
    return type.trim().toLowerCase().startsWith("vakantiedagen");
}

export function parseTotaalUren(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
    }
    if (typeof value !== "string") {
        return null;
    }
    const parsed = Number(value.trim().replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
}

export function leaveReasonFromData(
    data: Record<string, unknown> | null | undefined
): string {
    const type =
        typeof data?.typeVerlof === "string" ? data.typeVerlof.trim() : "";
    const kort =
        typeof data?.redenKortVerlof === "string"
            ? data.redenKortVerlof.trim()
            : "";
    const reden = typeof data?.reden === "string" ? data.reden.trim() : "";
    if (type.toLowerCase().startsWith("kort verlof")) {
        return kort || reden;
    }
    return reden || kort;
}

export function vacationDaysForRequest(
    from: string,
    to: string,
    year: number,
    totaalUren: number | null | undefined
): number {
    const daysInYear = weekdaysInYear(from, to, year);
    if (daysInYear <= 0) {
        return 0;
    }
    if (totaalUren == null) {
        return daysInYear;
    }
    const used = totaalUren / HOURS_PER_VACATION_DAY;
    const allDays = weekdaysInYear(from, to, yearFromDateKey(from));
    const toYear = yearFromDateKey(to);
    const totalSpan =
        toYear === yearFromDateKey(from)
            ? allDays
            : weekdaysInYear(from, to, yearFromDateKey(from)) +
              weekdaysInYear(from, to, toYear);
    if (totalSpan <= 0) {
        return used;
    }
    return used * (daysInYear / totalSpan);
}

export function yearFromDateKey(dateKey: string | null | undefined): number {
    if (!dateKey || dateKey.length < 4) {
        return Number(todayKey().slice(0, 4));
    }
    const year = Number(dateKey.slice(0, 4));
    return Number.isFinite(year) ? year : Number(todayKey().slice(0, 4));
}

export function vacationYearForPeriod(
    preset: PeriodPreset,
    customMonth: string,
    yearFilter?: YearMonthFilter,
    range?: { from: string; to: string } | null
): number {
    if (preset === "year") {
        return yearFilter?.year ?? Number(todayKey().slice(0, 4));
    }
    if (preset === "custom" && /^\d{4}-\d{2}$/.test(customMonth)) {
        return Number(customMonth.slice(0, 4));
    }
    if (range?.from) {
        return yearFromDateKey(range.from);
    }
    return Number(todayKey().slice(0, 4));
}

export function vacationItemsFromForms(
    forms: Array<{
        status: string;
        data: unknown;
        user: { id: string; name: string | null };
    }>
): VacationLeaveItem[] {
    const items: VacationLeaveItem[] = [];
    for (const form of forms) {
        const data = (form.data ?? {}) as Record<string, unknown>;
        const range = leaveDaysFromData(data);
        if (!range) {
            continue;
        }
        items.push({
            userId: form.user.id,
            userName: form.user.name ?? "Onbekend",
            from: range.from,
            to: range.to,
            type:
                typeof data.typeVerlof === "string" ? data.typeVerlof : null,
            reden: leaveReasonFromData(data),
            totaalUren: parseTotaalUren(data.totaalUren),
            status: form.status,
        });
    }
    return items;
}

export function leaveDaysFromData(data: Record<string, unknown> | null | undefined): {
    from: string;
    to: string;
} | null {
    const from = toDateKey(data?.eersteDag);
    const to = toDateKey(data?.laatsteDag) ?? from;
    if (!from || !to) {
        return null;
    }
    return { from, to };
}

export function weekdaysInYear(
    from: string,
    to: string,
    year: number
): number {
    return countWeekdaysInclusive(from, to, {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
    });
}

export type TakenLeaveDay = {
    date: string;
    type: string;
    reden: string;
    isVacation: boolean;
};

export function takenLeaveDaysInYear(
    leaves: VacationLeaveItem[],
    userId: string,
    year: number
): TakenLeaveDay[] {
    const yearRange = {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
    };
    const days: TakenLeaveDay[] = [];
    const seen = new Set<string>();

    for (const item of leaves) {
        if (item.userId !== userId) {
            continue;
        }
        if (item.status && item.status !== "geaccepteerd") {
            continue;
        }
        const type = item.type?.trim() || "Verlof";
        const reden = item.reden?.trim() || "";
        const keys = leaveWorkdayKeys(item.from, item.to, yearRange);
        for (const date of keys) {
            if (seen.has(date)) {
                continue;
            }
            seen.add(date);
            days.push({
                date,
                type,
                reden,
                isVacation: isVakantiedagen(item.type),
            });
        }
    }

    return days.sort((a, b) => a.date.localeCompare(b.date));
}

function isApproved(status: string | null | undefined): boolean {
    return !status || status === "geaccepteerd";
}

function usedAndPendingVacationInYear(
    leaves: VacationLeaveItem[],
    userId: string,
    year: number
): { used: number; pending: number; name: string } {
    let used = 0;
    let pending = 0;
    let name = "Onbekend";

    for (const item of leaves) {
        if (item.userId !== userId) {
            continue;
        }
        name = item.userName || name;
        if (!isVakantiedagen(item.type)) {
            continue;
        }
        const days = vacationDaysForRequest(
            item.from,
            item.to,
            year,
            item.totaalUren
        );
        if (days <= 0) {
            continue;
        }
        if (item.status === "ingediend") {
            pending += days;
        } else if (isApproved(item.status)) {
            used += days;
        }
    }

    return { used, pending, name };
}

function earliestVacationYear(
    leaves: VacationLeaveItem[],
    userId: string
): number | null {
    let earliest: number | null = null;
    for (const item of leaves) {
        if (item.userId !== userId || !isVakantiedagen(item.type)) {
            continue;
        }
        for (const key of [item.from, item.to]) {
            const year = yearFromDateKey(key);
            if (earliest == null || year < earliest) {
                earliest = year;
            }
        }
    }
    return earliest;
}

function remainingFromPreviousYear(
    leaves: VacationLeaveItem[],
    userId: string,
    year: number
): number {
    const earliest = earliestVacationYear(leaves, userId);
    const walkFrom = earliest == null ? year : Math.min(earliest, year);

    let remainingPrev = 0;
    for (let y = walkFrom; y < year; y += 1) {
        const { used } = usedAndPendingVacationInYear(leaves, userId, y);
        const entitled = VACATION_DAYS_PER_YEAR + remainingPrev;
        remainingPrev = Math.max(0, entitled - used);
    }
    return remainingPrev;
}

export function vacationBalanceForUser(
    leaves: VacationLeaveItem[],
    userId: string,
    year: number
): VacationBalance {
    const { used, pending, name } = usedAndPendingVacationInYear(
        leaves,
        userId,
        year
    );
    const carried = remainingFromPreviousYear(leaves, userId, year);
    const entitled = VACATION_DAYS_PER_YEAR + carried;

    return {
        userId,
        name,
        year,
        entitled,
        used,
        remaining: Math.max(0, entitled - used),
        pending,
        remainingFromPreviousYear: carried,
    };
}

export function vacationBalances(
    leaves: VacationLeaveItem[],
    year: number
): VacationBalance[] {
    const ids = new Set<string>();
    for (const item of leaves) {
        if (isVakantiedagen(item.type)) {
            ids.add(item.userId);
        }
    }

    return [...ids]
        .map((id) => vacationBalanceForUser(leaves, id, year))
        .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export function applyVacationToEngineers(
    engineers: EngineerPeriodTotals[],
    leaves: VacationLeaveItem[],
    year: number,
    engineerFilter: string
): EngineerPeriodTotals[] {
    const map = new Map(engineers.map((row) => [row.id, { ...row }]));
    const filteredLeaves =
        engineerFilter === "alle"
            ? leaves
            : leaves.filter((item) => item.userId === engineerFilter);

    for (const balance of vacationBalances(filteredLeaves, year)) {
        const existing = map.get(balance.userId);
        if (existing) {
            existing.vacationUsed = balance.used;
            existing.vacationRemaining = balance.remaining;
            existing.vacationPending = balance.pending;
            existing.vacationEntitled = balance.entitled;
            continue;
        }
        map.set(balance.userId, {
            id: balance.userId,
            name: balance.name,
            hours: 0,
            travel: 0,
            kilometers: 0,
            workorders: 0,
            leaveDays: 0,
            vacationUsed: balance.used,
            vacationRemaining: balance.remaining,
            vacationPending: balance.pending,
            vacationEntitled: balance.entitled,
        });
    }

    return [...map.values()].sort((a, b) => {
        if (b.hours !== a.hours) {
            return b.hours - a.hours;
        }
        return a.name.localeCompare(b.name, "nl");
    });
}
