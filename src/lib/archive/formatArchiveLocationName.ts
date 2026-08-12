/** Bekende merknamen zonder spaties → nette weergave. */
const KNOWN_LOCATIE_NAMES: Record<string, string> = {
    bakkerbart: "Bakker Bart",
};

const KNOWN_PLAATS_NAMES: Record<string, string> = {
    "den haag": "Den Haag",
    "'s-gravenhage": "'s-Gravenhage",
    sgravenhage: "'s-Gravenhage",
};

function titleCaseWord(word: string): string {
    if (!word) {
        return "";
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function titleCase(value: string): string {
    return value
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(titleCaseWord)
        .join(" ");
}

function normalizeKey(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function formatPlaatsName(raw?: string | null): string {
    if (!raw?.trim()) {
        return "";
    }

    const key = raw.trim().toLowerCase();

    if (KNOWN_PLAATS_NAMES[key]) {
        return KNOWN_PLAATS_NAMES[key];
    }

    return titleCase(raw);
}

function stripTrailingPlaats(locatie: string, plaats?: string | null): string {
    if (!plaats?.trim()) {
        return locatie.trim();
    }

    const locLower = locatie.trim().toLowerCase();
    const plaatsLower = plaats.trim().toLowerCase();

    if (locLower.endsWith(`, ${plaatsLower}`)) {
        return locatie.trim().slice(0, -(plaatsLower.length + 2)).trim();
    }

    if (locLower.endsWith(` ${plaatsLower}`)) {
        return locatie.trim().slice(0, -(plaatsLower.length + 1)).trim();
    }

    return locatie.trim();
}

export function formatLocatieName(
    raw?: string | null,
    plaats?: string | null
): string {
    if (!raw?.trim()) {
        return "Onbekende locatie";
    }

    let locatie = stripTrailingPlaats(raw, plaats);
    const key = normalizeKey(locatie);

    if (KNOWN_LOCATIE_NAMES[key]) {
        return KNOWN_LOCATIE_NAMES[key];
    }

    if (/\s/.test(locatie)) {
        return titleCase(locatie);
    }

    return titleCase(locatie);
}

/** Weergavenaam: "Locatienaam, Plaatsnaam" */
export function formatArchiveLocationLabel(
    locatieRaw?: string | null,
    plaatsRaw?: string | null
): string {
    const plaats = formatPlaatsName(plaatsRaw);
    const locatie = formatLocatieName(locatieRaw, plaatsRaw);

    if (plaats) {
        return `${locatie}, ${plaats}`;
    }

    return locatie;
}

/** Filesystem-veilige slug voor NAS-paden. */
export function archiveSlug(value: string): string {
    const cleaned = value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[,/\\]+/g, "-")
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return cleaned || "map";
}

export function formatArchiveLocationName(
    locatieRaw?: string | null,
    plaatsRaw?: string | null
): {
    label: string;
    slug: string;
    locationKey: string;
} {
    const label = formatArchiveLocationLabel(locatieRaw, plaatsRaw);
    const slug = archiveSlug(label);

    return {
        label,
        slug,
        locationKey: slug.toLowerCase(),
    };
}

export function archiveCustomerSlug(customerName: string): string {
    return archiveSlug(customerName);
}
