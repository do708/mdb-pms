/** Bekende merknamen zonder spaties → nette weergave. */
const KNOWN_LOCATIE_NAMES: Record<string, string> = {
    bakkerbart: "Bakker Bart",
};

const KNOWN_PLAATS_NAMES: Record<string, string> = {
    "den haag": "Den Haag",
    "'s-gravenhage": "'s-Gravenhage",
    sgravenhage: "'s-Gravenhage",
};

/** Voorvoegsels die niet in de locatiemap horen (merk/type/filiaal). */
const GENERIC_LOCATION_PREFIXES = [
    "filiaal",
    "vestiging",
    "winkel",
    "store",
    "locatie",
    "m cube",
    "m-cube",
    "mcube",
];

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

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripWholePhrase(haystack: string, phrase: string): string {
    const trimmed = phrase.trim();

    if (!trimmed || !haystack.trim()) {
        return haystack.trim();
    }

    const pattern = new RegExp(
        `(?:^|\\s+)${escapeRegExp(trimmed)}(?=\\s+|$)`,
        "ig"
    );

    return haystack.replace(pattern, " ").replace(/\s+/g, " ").trim();
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

function stripCustomerName(locatie: string, customerName?: string | null): string {
    if (!customerName?.trim()) {
        return locatie.trim();
    }

    return stripWholePhrase(locatie, customerName);
}

function stripGenericPrefixes(locatie: string): string {
    let current = locatie.trim();
    let changed = true;

    while (changed && current) {
        changed = false;

        for (const prefix of GENERIC_LOCATION_PREFIXES) {
            const next = stripWholePhrase(current, prefix);

            if (next !== current) {
                current = next;
                changed = true;
            }
        }
    }

    return current;
}

export function formatLocatieName(
    raw?: string | null,
    plaats?: string | null
): string {
    if (!raw?.trim()) {
        return plaats?.trim() ? formatPlaatsName(plaats) : "Onbekende locatie";
    }

    let locatie = stripTrailingPlaats(raw, plaats);
    const key = normalizeKey(locatie);

    if (KNOWN_LOCATIE_NAMES[key]) {
        return KNOWN_LOCATIE_NAMES[key];
    }

    return titleCase(locatie);
}

/**
 * Locatiemap onder de opdrachtgever: "Almere Buiten", niet
 * "M Cube Wibra Almere Buiten, Almere Buiten".
 */
export function formatArchiveLocationLabel(
    locatieRaw?: string | null,
    plaatsRaw?: string | null,
    customerName?: string | null
): string {
    const plaats = formatPlaatsName(plaatsRaw);
    const stripped = stripGenericPrefixes(
        stripCustomerName(locatieRaw ?? "", customerName)
    );

    if (!stripped && plaats) {
        return plaats;
    }

    const withoutPlaats = stripTrailingPlaats(stripped, plaatsRaw);

    if (plaats && stripped && withoutPlaats !== stripped) {
        if (!withoutPlaats || GENERIC_LOCATION_PREFIXES.includes(
            withoutPlaats.toLowerCase()
        )) {
            return plaats;
        }
    }

    if (stripped) {
        const locatie = formatLocatieName(stripped, plaatsRaw);

        if (!plaats) {
            return locatie;
        }

        const locLower = locatie.toLowerCase();
        const plaatsLower = plaats.toLowerCase();

        if (locLower === plaatsLower || locLower.includes(plaatsLower)) {
            return locatie;
        }

        if (plaatsLower.includes(locLower)) {
            return plaats;
        }

        return locatie;
    }

    return plaats || "Onbekende locatie";
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
    plaatsRaw?: string | null,
    customerName?: string | null
): {
    label: string;
    slug: string;
    locationKey: string;
} {
    const label = formatArchiveLocationLabel(
        locatieRaw,
        plaatsRaw,
        customerName
    );
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

export function archiveCustomerLabel(customerName?: string | null): string {
    const name = (customerName || "").trim();

    return name || "Onbekende opdrachtgever";
}
