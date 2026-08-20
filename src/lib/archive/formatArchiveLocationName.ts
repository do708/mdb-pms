/** Bekende merknamen zonder spaties → nette weergave. */
const KNOWN_COMPANY_NAMES: Record<string, string> = {
    kfc: "KFC",
    wibra: "Wibra",
    plus: "Plus",
    hema: "HEMA",
    action: "Action",
    kruidvat: "Kruidvat",
    "bakkerbart": "Bakker Bart",
    "bakker bart": "Bakker Bart",
    "m-cube": "M-Cube",
    mcube: "M-Cube",
    "m cube": "M-Cube",
    mdb: "MDB",
    "mdbnetworks": "MDB Networks",
    "mdb networks": "MDB Networks",
};

const KNOWN_LOCATIE_NAMES: Record<string, string> = {
    bakkerbart: "Bakker Bart",
};

const KNOWN_PLAATS_NAMES: Record<string, string> = {
    "den haag": "Den Haag",
    "'s-gravenhage": "'s-Gravenhage",
    sgravenhage: "'s-Gravenhage",
};

const ACRONYMS = new Set(["kfc", "hema", "mdb", "ah"]);

/** Opdrachtgevers die zelf de keten niet zijn (installateur). */
const INSTALLER_COMPANY_KEYS = new Set([
    "mcube",
    "m-cube",
    "mdb",
    "mdbnetworks",
]);

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

export function normalizeKey(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, "");
}

function titleCaseWord(word: string): string {
    if (!word) {
        return "";
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function formatCompanyWord(word: string): string {
    if (!word) {
        return "";
    }

    if (word.includes("-") && word !== "-") {
        return word.split("-").map(formatCompanyWord).join("-");
    }

    const lower = word.toLowerCase();

    if (KNOWN_COMPANY_NAMES[lower] && !lower.includes(" ")) {
        return KNOWN_COMPANY_NAMES[lower];
    }

    if (ACRONYMS.has(lower)) {
        return word.toUpperCase();
    }

    return titleCaseWord(word);
}

function titleCase(value: string): string {
    return value
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(formatCompanyWord)
        .join(" ");
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

    if (KNOWN_COMPANY_NAMES[key]) {
        return KNOWN_COMPANY_NAMES[key];
    }

    return titleCase(locatie);
}

/** Bedrijfs-/ketennaam: KFC, niet kfc of Kfc. */
export function formatCompanyName(raw?: string | null): string {
    const name = (raw || "").trim();

    if (!name) {
        return "Onbekende opdrachtgever";
    }

    const key = normalizeKey(name);

    if (KNOWN_COMPANY_NAMES[key]) {
        return KNOWN_COMPANY_NAMES[key];
    }

    const spaced = name.toLowerCase().replace(/\s+/g, " ");

    if (KNOWN_COMPANY_NAMES[spaced]) {
        return KNOWN_COMPANY_NAMES[spaced];
    }

    return titleCase(name);
}

export function archiveCompanyKey(raw?: string | null): string {
    return normalizeKey(formatCompanyName(raw));
}

export function isInstallerCompany(raw?: string | null): boolean {
    return INSTALLER_COMPANY_KEYS.has(archiveCompanyKey(raw));
}

/** Keten uit locatienaam, bv. "KFC Bijgaarden Basilux" → "KFC". */
export function extractRetailBrand(
    locatieRaw?: string | null,
    customerName?: string | null
): string | null {
    const stripped = stripGenericPrefixes(
        stripCustomerName(locatieRaw ?? "", customerName)
    );

    if (!stripped) {
        return null;
    }

    const lower = stripped.toLowerCase();
    const brands = Object.entries(KNOWN_COMPANY_NAMES)
        .filter(([key]) => !INSTALLER_COMPANY_KEYS.has(normalizeKey(key)))
        .sort((a, b) => b[0].length - a[0].length);

    for (const [key, label] of brands) {
        const asPhrase = key.includes(" ") ? key : label.toLowerCase();
        const variants = Array.from(new Set([key, asPhrase, label.toLowerCase()]));

        for (const variant of variants) {
            if (
                lower === variant
                || lower.startsWith(`${variant} `)
                || lower.startsWith(`${variant}-`)
            ) {
                return label;
            }
        }
    }

    return null;
}

function locationBody(
    locatieRaw?: string | null,
    plaatsRaw?: string | null,
    stripNames: Array<string | null | undefined> = []
): string {
    const plaats = formatPlaatsName(plaatsRaw);
    let stripped = locatieRaw ?? "";

    for (const name of stripNames) {
        stripped = stripCustomerName(stripped, name);
    }

    stripped = stripGenericPrefixes(stripped);

    if (!stripped && plaats) {
        return plaats;
    }

    const withoutPlaats = stripTrailingPlaats(stripped, plaatsRaw);
    const locatie = formatLocatieName(withoutPlaats || stripped, plaatsRaw);

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

    return `${locatie}, ${plaats}`;
}

/**
 * Locatiemap: "[Filiaalnaam] - [locatie], [plaats]"
 * bv. "KFC - Amsterdam, Buitendreef" of "Wibra - Almere Buiten".
 */
export function formatArchiveLocationLabel(
    locatieRaw?: string | null,
    plaatsRaw?: string | null,
    customerName?: string | null
): string {
    const brand =
        extractRetailBrand(locatieRaw, customerName)
        || (isInstallerCompany(customerName)
            ? ""
            : formatCompanyName(customerName));

    const body = locationBody(
        locatieRaw,
        plaatsRaw,
        [customerName, brand]
    );

    if (!body) {
        return brand || "Onbekende locatie";
    }

    if (!brand) {
        return body;
    }

    const brandLower = brand.toLowerCase();
    const bodyLower = body.toLowerCase();

    if (bodyLower === brandLower || bodyLower.startsWith(`${brandLower} `)
        || bodyLower.startsWith(`${brandLower} -`)) {
        if (bodyLower === brandLower) {
            return brand;
        }

        const rest = body.slice(brand.length).replace(/^\s*-?\s*/, "");

        return rest ? `${brand} - ${rest}` : brand;
    }

    return `${brand} - ${body}`;
}

export function archiveWorkorderTree(opts: {
    customerName?: string | null;
    locatieRaw?: string | null;
    plaatsRaw?: string | null;
}): {
    companies: string[];
    location: string;
    locationKey: string;
} {
    const customer = formatCompanyName(opts.customerName);
    const brand = extractRetailBrand(opts.locatieRaw, opts.customerName);
    const location = formatArchiveLocationLabel(
        opts.locatieRaw,
        opts.plaatsRaw,
        opts.customerName
    );

    let companies: string[];

    if (
        isInstallerCompany(opts.customerName)
        && brand
        && archiveCompanyKey(brand) !== archiveCompanyKey(customer)
    ) {
        companies = [customer, brand];
    } else if (brand && isInstallerCompany(opts.customerName)) {
        companies = [brand];
    } else {
        companies = [customer];
    }

    if (
        companies.length > 1
        && brand
        && location.toLowerCase().startsWith(`${brand.toLowerCase()} - `)
    ) {
        const nested = location.slice(brand.length + 3).trim();

        return {
            companies,
            location: nested || location,
            locationKey: normalizeKey(nested || location),
        };
    }

    return {
        companies,
        location,
        locationKey: normalizeKey(location),
    };
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
    return archiveSlug(formatCompanyName(customerName));
}

export function archiveCustomerLabel(customerName?: string | null): string {
    return formatCompanyName(customerName);
}
