export type BunniDocumentKind = "offerte" | "factuur";

export type BunniDocument = {
    id: string;
    number: string;
    date: string | null;
    isFinalized: boolean;
    contactName: string | null;
    pdfUrl: string | null;
    snippet: string | null;
    kind: BunniDocumentKind;
};

type Cache = {
    at: number;
    items: BunniDocument[];
};

const CACHE_MS = 5 * 60 * 1000;
let invoiceCache: Cache | null = null;
let quoteCache: Cache | null = null;

function bunniConfig() {
    // Strip per ongeluk meegestuurde Vercel-flags uit de env-waarde.
    const clean = (value: string | undefined) =>
        (value || "")
            .trim()
            .replace(/[\r\n]+/g, "")
            .replace(/sensitive$/i, "")
            .trim();

    const apiKey = clean(process.env.BUNNI_API_KEY);
    const businessId =
        clean(process.env.BUNNI_BUSINESS_ID) || "mdb-networks";

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

function firstString(...values: unknown[]): string {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return "";
}

function contactNameFrom(raw: Record<string, unknown>): string | null {
    const contact =
        (raw.referencedContact as Record<string, unknown> | null) ||
        (raw.contact as Record<string, unknown> | null) ||
        {};

    return (
        (typeof contact.companyName === "string" && contact.companyName) ||
        (typeof contact.name === "string" && contact.name) ||
        null
    );
}

function snippetFrom(raw: Record<string, unknown>): string | null {
    const rows = Array.isArray(raw.rows) ? raw.rows : [];
    return (
        rows
            .map((row) =>
                stripHtml(
                    row && typeof row === "object"
                        ? (row as { description?: unknown }).description
                        : ""
                )
            )
            .find(Boolean) || null
    );
}

function looksLikeQuote(raw: Record<string, unknown>): boolean {
    const type = firstString(raw.type, raw.documentType, raw.kind).toLowerCase();
    if (type.includes("quote") || type.includes("offerte") || type.includes("estimate")) {
        return true;
    }
    const id = typeof raw.id === "string" ? raw.id : "";
    if (/^(qu_|qt_|es_)/i.test(id)) {
        return true;
    }
    const quoteNumber = firstString(
        raw.quoteNumber,
        raw.quotationNumber,
        raw.offerteNumber,
        raw.offerteNummer
    );
    const invoiceNumber = firstString(raw.invoiceNumber);
    return Boolean(quoteNumber && !invoiceNumber);
}

function mapItem(
    raw: Record<string, unknown>,
    kind: BunniDocumentKind
): BunniDocument | null {
    const id = typeof raw.id === "string" ? raw.id : "";
    const number =
        kind === "offerte"
            ? firstString(
                raw.quoteNumber,
                raw.quotationNumber,
                raw.offerteNumber,
                raw.offerteNummer,
                raw.number,
                raw.invoiceNumber
            )
            : firstString(raw.invoiceNumber, raw.number);

    if (!id || !number) {
        return null;
    }

    const date =
        kind === "offerte"
            ? firstString(
                raw.quoteDate,
                raw.quotationDate,
                raw.offerteDate,
                raw.offerteDatum,
                raw.date,
                raw.invoiceDate
            ) || null
            : firstString(raw.invoiceDate, raw.date) || null;

    return {
        id,
        number,
        date,
        isFinalized: raw.isFinalized === true || raw.isFinalized === "true",
        contactName: contactNameFrom(raw),
        pdfUrl: typeof raw.pdfUrl === "string" ? raw.pdfUrl : null,
        snippet: snippetFrom(raw),
        kind,
    };
}

class BunniHttpError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
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
        const bunniMessage = json?.error?.message || "";
        if (response.status === 403 || bunniMessage === "forbidden") {
            throw new BunniHttpError(
                "Bunni weigert de API-sleutel. Controleer BUNNI_API_KEY en BUNNI_BUSINESS_ID.",
                403
            );
        }
        throw new BunniHttpError(
            bunniMessage || `Bunni gaf ${response.status}`,
            response.status
        );
    }

    return json.data;
}

async function fetchPagedList(
    listPath: string,
    kind: BunniDocumentKind
): Promise<BunniDocument[]> {
    const items: BunniDocument[] = [];
    let next: string | null = null;
    let pages = 0;

    while (pages < 40) {
        const qs = new URLSearchParams({ take: "250" });
        if (next) {
            qs.set("next", next);
        }

        const data = (await bunniGet(`${listPath}?${qs}`)) as {
            items?: unknown[];
            next?: string | null;
        };

        const page = Array.isArray(data.items) ? data.items : [];

        for (const raw of page) {
            if (!raw || typeof raw !== "object") {
                continue;
            }
            const mapped = mapItem(raw as Record<string, unknown>, kind);
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

async function fetchAllInvoices(): Promise<BunniDocument[]> {
    return fetchPagedList("invoices/list", "factuur");
}

async function fetchQuotesFromInvoiceList(): Promise<BunniDocument[]> {
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
            const record = raw as Record<string, unknown>;
            if (!looksLikeQuote(record)) {
                continue;
            }
            const mapped = mapItem(record, "offerte");
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

async function fetchAllQuotes(): Promise<BunniDocument[]> {
    const paths = ["quotes/list", "estimates/list", "quotations/list"];

    for (const path of paths) {
        try {
            return await fetchPagedList(path, "offerte");
        } catch (error) {
            if (error instanceof BunniHttpError && error.status === 403) {
                throw error;
            }
            console.warn("BUNNI QUOTES PATH MISS", path, error);
        }
    }

    return fetchQuotesFromInvoiceList();
}

export async function listBunniDocuments(force = false): Promise<BunniDocument[]> {
    if (!force && invoiceCache && Date.now() - invoiceCache.at < CACHE_MS) {
        return invoiceCache.items;
    }

    const items = await fetchAllInvoices();
    invoiceCache = { at: Date.now(), items };
    return items;
}

export async function listBunniQuotes(force = false): Promise<BunniDocument[]> {
    if (!force && quoteCache && Date.now() - quoteCache.at < CACHE_MS) {
        return quoteCache.items;
    }

    const items = await fetchAllQuotes();
    quoteCache = { at: Date.now(), items };
    return items;
}

export async function getBunniDocument(
    id: string
): Promise<BunniDocument | null> {
    const invoices = await listBunniDocuments();
    const invoice = invoices.find((item) => item.id === id);
    if (invoice) {
        return invoice;
    }

    const quotes = await listBunniQuotes();
    return quotes.find((item) => item.id === id) ?? null;
}

export function searchBunniDocuments(
    items: BunniDocument[],
    query: string,
    kind: "offerte" | "factuur" | "alle" = "factuur"
) {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
        if (kind === "factuur") {
            if (item.kind === "offerte") {
                return false;
            }
            if (!item.isFinalized) {
                return false;
            }
        }
        if (kind === "offerte" && item.kind === "factuur") {
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

    return filtered.slice(0, 40);
}
