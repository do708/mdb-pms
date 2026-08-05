export type BudgetSignal = "groen" | "oranje" | "rood" | "onbekend";

export function projectIsActive(status: string): boolean {
    return status === "actief" || status === "new";
}

export function budgetSignal(
    gebruikt: number,
    geoffreerd: number | null | undefined
): BudgetSignal {
    if (geoffreerd == null || geoffreerd <= 0) {
        return "onbekend";
    }

    const ratio = gebruikt / geoffreerd;

    if (ratio > 1) {
        return "rood";
    }

    if (ratio >= 0.8) {
        return "oranje";
    }

    return "groen";
}

export function signalClasses(signal: BudgetSignal): string {
    switch (signal) {
        case "groen":
            return "bg-emerald-100 text-emerald-800 border-emerald-200";
        case "oranje":
            return "bg-amber-100 text-amber-900 border-amber-200";
        case "rood":
            return "bg-red-100 text-red-800 border-red-200";
        default:
            return "bg-gray-100 text-gray-600 border-gray-200";
    }
}

export function decimalToNumber(
    value: { toString(): string } | number | null | undefined
): number {
    if (value == null) {
        return 0;
    }

    if (typeof value === "number") {
        return value;
    }

    const n = Number(value.toString());

    return Number.isFinite(n) ? n : 0;
}
