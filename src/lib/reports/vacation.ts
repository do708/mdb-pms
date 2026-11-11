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

export type VacationLeaveItem = {
    userId: string;
    userName: string;
    from: string;
    to: string;
    type?: string | null;
    reden?: string | null;
    omvang?: string | null;
    status?: string | null;
    /** true/false na kantoorbeslissing; null = oude aanvraag zonder vlag */
    aftrekVakantie?: boolean | null;
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

export function isKortVerlof(type: unknown): boolean {
    if (typeof type !== "string") {
        return false;
    }
    return type.trim().toLowerCase().startsWith("kort verlof");
}

export function parseAftrekVakantie(value: unknown): boolean | null {
    if (typeof value === "boolean") {
        return value;
    }
    if (value === "true") {
        return true;
    }
    if (value === "false") {
        return false;
    }
    return null;
}

/** Goedgekeurd verlof telt alleen mee voor saldo bij expliciete aftrek; oude records: vakantiedagen wel, overig niet. */
export function deductsFromVacationBalance(
    type: unknown,
    status: string | null | undefined,
    aftrekVakantie: boolean | null | undefined
): boolean {
    if (status && status !== "geaccepteerd") {
        return false;
    }
    if (typeof aftrekVakantie === "boolean") {
        return aftrekVakantie;
    }
    return isVakantiedagen(type);
}

export function parseLeaveOmvang(value: unknown): string {
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }
    return "Hele dag";
}

export function isHalveDag(omvang: unknown): boolean {
    return parseLeaveOmvang(omvang).toLowerCase().startsWith("halve");
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
    if (isKortVerlof(type)) {
        return kort || reden;
    }
    return reden || kort;
}

export function vacationDaysForRequest(
    from: string,
    to: string,
    year: number,
    omvang?: string | null
): number {
    const daysInYear = weekdaysInYear(from, to, year);
    if (daysInYear <= 0) {
        return 0;
    }
    return isHalveDag(omvang) ? daysInYear * 0.5 : daysInYear;
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
            omvang: parseLeaveOmvang(data.omvang),
            status: form.status,
            aftrekVakantie: parseAftrekVakantie(data.aftrekVakantie),
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
                isVacation: deductsFromVacationBalance(
                    item.type,
                    item.status,
                    item.aftrekVakantie
                ),
            });
        }
    }

    return days.sort((a, b) => a.date.localeCompare(b.date));
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
        const days = vacationDaysForRequest(
            item.from,
            item.to,
            year,
            item.omvang
        );
        if (days <= 0) {
            continue;
        }
        if (item.status === "ingediend") {
            if (isVakantiedagen(item.type) && item.aftrekVakantie !== false) {
                pending += days;
            }
            continue;
        }
        if (
            deductsFromVacationBalance(
                item.type,
                item.status,
                item.aftrekVakantie
            )
        ) {
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
        if (item.userId !== userId) {
            continue;
        }
        const counts =
            deductsFromVacationBalance(
                item.type,
                item.status,
                item.aftrekVakantie
            ) ||
            (item.status === "ingediend" &&
                isVakantiedagen(item.type) &&
                item.aftrekVakantie !== false);
        if (!counts) {
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
        const counts =
            deductsFromVacationBalance(
                item.type,
                item.status,
                item.aftrekVakantie
            ) ||
            (item.status === "ingediend" &&
                isVakantiedagen(item.type) &&
                item.aftrekVakantie !== false);
        if (counts) {
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
