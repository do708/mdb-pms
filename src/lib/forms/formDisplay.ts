export function nlFormDate(value: unknown): string {
    if (!value || typeof value !== "string") {
        return "";
    }

    const d = new Date(value);

    if (isNaN(d.getTime())) {
        return "";
    }

    return d.toLocaleDateString("nl-NL");
}

export function verlofMonteurName(
    data?: Record<string, unknown> | null,
    userName?: string | null
): string {
    const werknemer = data?.werknemer;

    if (typeof werknemer === "string" && werknemer.trim()) {
        return werknemer.trim();
    }

    return userName?.trim() || "Onbekend";
}

/** Opgeslagen titel + weergave: "Verlofaanvraag, [naam]" */
export function buildVerlofTitle(
    data?: Record<string, unknown> | null,
    userName?: string | null
): string {
    return `Verlofaanvraag, ${verlofMonteurName(data, userName)}`;
}

/** Ondertitel: "type verlof | datum van - datum tot" */
export function verlofSubtitle(data?: Record<string, unknown> | null): string {
    const type =
        typeof data?.typeVerlof === "string" ? data.typeVerlof.trim() : "";
    const from = nlFormDate(data?.eersteDag);
    const to = nlFormDate(data?.laatsteDag);

    const datePart =
        from && to ? `${from} - ${to}` : from || to || "";

    if (type && datePart) {
        return `${type} | ${datePart}`;
    }

    return type || datePart;
}

export function buildFormTitle(
    type: string,
    data: Record<string, unknown> | null | undefined,
    userName?: string | null,
    label?: string
): string {
    if (type === "verlof") {
        return buildVerlofTitle(data, userName);
    }

    return `${label ?? type} ${userName ?? ""}`.trim();
}
