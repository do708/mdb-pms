export type BunniDocument = {
    id: string;
    number: string;
    date: string | null;
    isFinalized: boolean;
    contactName: string | null;
    pdfUrl: string | null;
    snippet: string | null;
};

type Cache = {
    at: number;
    items: BunniDocument[];
};

const CACHE_MS = 5 * 60 * 1000;
let cache: Cache | null = null;

function bunniConfig() {
    const apiKey = process.env.BUNNI_API_KEY?.trim();
    const businessId =
        process.env.BUNNI_BUSINESS_ID?.trim() || "mdb-networks";

    if (!apiKey) {
        return null;
    }

    return { apiKey, businessId };
}

export function isBunniConfigured() {
    return bunniConfig() != null;
}

function stripHtml(value: unknown): string {
    if (typeof value !== "string") {
        return "";
    }

    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function mapItem(raw: Record<string, unknown>): BunniDocument | null {
    const id = typeof raw.id === "string" ? raw.id : "";
    const number =
        typeof raw.invoiceNumber === "string" ? raw.invoiceNumber.trim() : "";

    if (!id || !number) {
        return null;
    }

    const contact =
        (raw.referencedContact as Record<string, unknown> | null) ||
        (raw.contact as Record<string, unknown> | null) ||
        {};
    const contactName =
        (typeof contact.companyName === "string" && contact.companyName) ||
        (typeof contact.name === "string" && contact.name) ||
        null;

    const rows = Array.isArray(raw.rows) ? raw.rows : [];
    const snippet =
        rows
            .map((row) =>
                stripHtml(
                    row && typeof row === "object"
                        ? (row as { description?: unknown }).description
                        : ""
                )
            )
            .find(Boolean) || null;

    return {
        id,
        number,
        date: typeof raw.invoiceDate === "string" ? raw.invoiceDate : null,
        isFinalized: raw.isFinalized === true || raw.isFinalized === "true",
        contactName,
        pdfUrl: typeof raw.pdfUrl === "string" ? raw.pdfUrl : null,
        snippet,
    };
}

async function bunniGet(path: string): Promise<unknown> {
    const config = bunniConfig();

    if (!config) {
        throw new Error("Bunni is niet geconfigureerd");
    }

    const url = `https://api.bunni.nl/0.1/${config.businessId}/${path}`;
    const response = await fetch(url, {
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${config.apiKey}`,
        },
        cache: "no-store",
    });

    const json = (await response.json().catch(() => null)) as {
        status?: string;
        data?: unknown;
        error?: { message?: string };
    } | null;

    if (!response.ok || json?.status !== "success") {
        throw new Error(
            json?.error?.message || `Bunni gaf ${response.status}`
        );
    }

    return json.data;
}

async function fetchAllDocuments(): Promise<BunniDocument[]> {
    const items: BunniDocument[] = [];
    let next: string | null = null;
    let pages = 0;

    while (pages < 40) {
        const qs = new URLSearchParams({ take: "250" });
        if (next) {
            qs.set("next", next);
        }

        const data = (await bunniGet(`invoices/list?${qs}`)) as {
            items?: unknown[];
            next?: string | null;
        };

        const page = Array.isArray(data.items) ? data.items : [];

        for (const raw of page) {
            if (!raw || typeof raw !== "object") {
                continue;
            }
            const mapped = mapItem(raw as Record<string, unknown>);
            if (mapped) {
                items.push(mapped);
            }
        }

        pages += 1;
        next = typeof data.next === "string" && data.next ? data.next : null;

        if (!next || page.length === 0) {
            break;
        }
    }

    return items;
}

export async function listBunniDocuments(force = false): Promise<BunniDocument[]> {
    if (!force && cache && Date.now() - cache.at < CACHE_MS) {
        return cache.items;
    }

    const items = await fetchAllDocuments();
    cache = { at: Date.now(), items };
    return items;
}

export async function getBunniDocument(
    id: string
): Promise<BunniDocument | null> {
    const items = await listBunniDocuments();
    return items.find((item) => item.id === id) ?? null;
}

export function searchBunniDocuments(
    items: BunniDocument[],
    query: string,
    kind: "offerte" | "factuur" | "alle" = "alle"
) {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
        if (kind === "offerte" && item.isFinalized) {
            return false;
        }
        if (kind === "factuur" && !item.isFinalized) {
            return false;
        }
        if (!q) {
            return true;
        }
        return (
            item.number.toLowerCase().includes(q) ||
            (item.contactName || "").toLowerCase().includes(q) ||
            (item.snippet || "").toLowerCase().includes(q)
        );
    });

    // In Bunni staan offertes als niet-afgeronde facturen. Als die lijst
    // leeg is, toon alle documenten zodat je toch een nummer kunt koppelen.
    if (kind === "offerte" && filtered.length === 0 && items.length > 0) {
        return searchBunniDocuments(items, query, "alle");
    }

    return filtered.slice(0, 40);
}
