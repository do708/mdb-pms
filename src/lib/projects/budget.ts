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

/** Intern uurtarief voor project-totaal (uren × tarief + materiaal − offerte). */
export const PROJECT_UUR_TARIEF = 55;

export const PROJECT_TERMIJNEN = [
    {
        key: "termijn1Gefactureerd",
        dateKey: "termijn1GefactureerdOp",
        numKey: "termijn1Factuurnummer",
        label: "Termijn 1 — akkoord opdracht (inkoop)",
        percentage: 30,
    },
    {
        key: "termijn2Gefactureerd",
        dateKey: "termijn2GefactureerdOp",
        numKey: "termijn2Factuurnummer",
        label: "Termijn 2 — start opdracht",
        percentage: 30,
    },
    {
        key: "termijn3Gefactureerd",
        dateKey: "termijn3GefactureerdOp",
        numKey: "termijn3Factuurnummer",
        label: "Termijn 3 — halverwege opdracht",
        percentage: 30,
    },
    {
        key: "termijn4Gefactureerd",
        dateKey: "termijn4GefactureerdOp",
        numKey: "termijn4Factuurnummer",
        label: "Termijn 4 — eind / oplevering",
        percentage: 10,
    },
] as const;

export function termijnBedrag(
    offerte: number,
    percentage: number
): number {
    if (!(offerte > 0)) {
        return 0;
    }

    return (offerte * percentage) / 100;
}

export function projectUrenKosten(
    uren: number,
    tarief = PROJECT_UUR_TARIEF
): number {
    return uren * tarief;
}

export function projectKostenTotaal(
    uren: number,
    materiaal: number,
    tarief = PROJECT_UUR_TARIEF
): number {
    return projectUrenKosten(uren, tarief) + materiaal;
}

/** Kosten − offerte. Positief = over budget (rood), negatief of 0 = binnen budget (groen). */
export function projectEindbedrag(
    uren: number,
    materiaal: number,
    offerte: number,
    tarief = PROJECT_UUR_TARIEF
): number {
    return projectKostenTotaal(uren, materiaal, tarief) - offerte;
}

export function projectEindbedragSignal(
    eindbedrag: number,
    heeftOfferte: boolean
): BudgetSignal {
    if (!heeftOfferte) {
        return "onbekend";
    }

    return eindbedrag > 0 ? "rood" : "groen";
}
