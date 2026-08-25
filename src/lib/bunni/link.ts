import type { BunniDocument } from "@/lib/bunni/client";
import { getBunniDocument } from "@/lib/bunni/client";

export type BunniLinkFields = {
    bunniOfferteId: string | null;
    bunniOfferteNummer: string | null;
    bunniOffertePdfUrl: string | null;
    bunniFactuurId: string | null;
    bunniFactuurNummer: string | null;
    bunniFactuurPdfUrl: string | null;
};

function offerteFields(doc: BunniDocument | null) {
    return {
        bunniOfferteId: doc?.id ?? null,
        bunniOfferteNummer: doc?.number ?? null,
        bunniOffertePdfUrl: doc?.pdfUrl ?? null,
    };
}

function factuurFields(doc: BunniDocument | null) {
    return {
        bunniFactuurId: doc?.id ?? null,
        bunniFactuurNummer: doc?.number ?? null,
        bunniFactuurPdfUrl: doc?.pdfUrl ?? null,
    };
}

export async function resolveBunniLinkPatch(body: {
    offerteId?: string | null;
    factuurId?: string | null;
}): Promise<Partial<BunniLinkFields>> {
    const data: Partial<BunniLinkFields> = {};

    if (body.offerteId !== undefined) {
        if (!body.offerteId) {
            Object.assign(data, offerteFields(null));
        } else {
            const doc = await getBunniDocument(body.offerteId);
            if (!doc) {
                throw new Error("Bunni-offerte niet gevonden");
            }
            Object.assign(data, offerteFields(doc));
        }
    }

    if (body.factuurId !== undefined) {
        if (!body.factuurId) {
            Object.assign(data, factuurFields(null));
        } else {
            const doc = await getBunniDocument(body.factuurId);
            if (!doc) {
                throw new Error("Bunni-factuur niet gevonden");
            }
            Object.assign(data, factuurFields(doc));
        }
    }

    return data;
}
