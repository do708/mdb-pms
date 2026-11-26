import {
    TOOL_DUE_SOON_DAYS,
    type ToolStatus,
} from "@/constants/gereedschap";

export type StatusInput = {
    archivedAt?: Date | null;
    lastResult?: string | null;
    nextInspectionAt?: Date | null;
    lastInspectionAt?: Date | null;
    now?: Date;
};

/**
 * Berekent de actuele status. Gearchiveerd en afgekeurd winnen altijd;
 * anders volgt de status uit de volgende keuringsdatum.
 */
export function computeToolStatus(input: StatusInput): ToolStatus {
    const now = input.now ?? new Date();

    if (input.archivedAt) {
        return "gearchiveerd";
    }

    if (input.lastResult === "afgekeurd") {
        return "afgekeurd";
    }

    if (!input.lastInspectionAt && !input.nextInspectionAt) {
        return "nog_te_keuren";
    }

    const next = input.nextInspectionAt;
    if (!next) {
        return input.lastResult === "goedgekeurd"
            ? "goedgekeurd"
            : "nog_te_keuren";
    }

    if (next.getTime() < now.getTime()) {
        return "verlopen";
    }

    const soonMs = TOOL_DUE_SOON_DAYS * 24 * 60 * 60 * 1000;
    if (next.getTime() - now.getTime() <= soonMs) {
        return "binnenkort";
    }

    return "goedgekeurd";
}

export function addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}
