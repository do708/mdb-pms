export function nlFormDate(value: unknown): string {
    if (!value || typeof value !== "string") {
        return "";
    }

    const isoDag = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());

    if (isoDag) {
        const date = new Date(
            Number(isoDag[1]),
            Number(isoDag[2]) - 1,
            Number(isoDag[3])
        );

        if (isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    const d = new Date(value);

    if (isNaN(d.getTime())) {
        return "";
    }

    return d.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
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

function leaveOmvangLabel(omvang: unknown): string {
    if (typeof omvang !== "string") {
        return "";
    }
    const text = omvang.trim();
    if (!text) {
        return "";
    }
    if (text.toLowerCase().startsWith("halve")) {
        return "Halve dag";
    }
    if (text.toLowerCase().startsWith("hele")) {
        return "";
    }
    return text;
}

/** Ondertitel: "type verlof | datum van - datum tot" */
export function verlofSubtitle(data?: Record<string, unknown> | null): string {
    const type =
        typeof data?.typeVerlof === "string" ? data.typeVerlof.trim() : "";
    const kort =
        typeof data?.redenKortVerlof === "string"
            ? data.redenKortVerlof.trim()
            : "";
    const redenRaw =
        typeof data?.reden === "string" ? data.reden.trim() : "";
    const reden = kort || redenRaw;
    const from = nlFormDate(data?.eersteDag);
    const to = nlFormDate(data?.laatsteDag);
    const omvang = leaveOmvangLabel(data?.omvang);

    const datePart =
        from && to ? `${from} - ${to}` : from || to || "";

    const typePart =
        type && reden ? `${type} · ${reden}` : type || reden;

    const head = [typePart, omvang].filter(Boolean).join(" · ");

    if (head && datePart) {
        return `${head} | ${datePart}`;
    }

    return head || datePart;
}

export function verlofPlanningLabel(
    type?: string | null,
    reden?: string | null,
    omvang?: string | null
): string {
    const soort = typeof type === "string" ? type.trim() : "";
    const extra = typeof reden === "string" ? reden.trim() : "";
    const size = leaveOmvangLabel(omvang);
    const parts = [soort, extra, size].filter(Boolean);
    return parts.join(" · ") || "Verlof";
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
