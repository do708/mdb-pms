import type { BunniDocument } from "@/lib/bunni/client";
import { getBunniDocument } from "@/lib/bunni/client";
import { bunniNumericId } from "@/lib/bunni/urls";

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
    offerteNumber?: string | null;
    offertePdfUrl?: string | null;
    factuurId?: string | null;
    factuurNumber?: string | null;
    factuurPdfUrl?: string | null;
}): Promise<Partial<BunniLinkFields>> {
    const data: Partial<BunniLinkFields> = {};

    if (body.offerteId !== undefined) {
        if (!body.offerteId) {
            Object.assign(data, offerteFields(null));
        } else {
            const doc = await getBunniDocument(body.offerteId);
            if (doc) {
                Object.assign(data, offerteFields(doc));
            } else {
                const number =
                    typeof body.offerteNumber === "string"
                    && body.offerteNumber.trim()
                    ?
                    body.offerteNumber.trim()
                    :
                    null;
                const urlId = bunniNumericId(body.offerteId);
                if (!number || number === urlId) {
                    throw new Error(
                        "Vul het offertenummer uit het Bunni-formulier in, niet het nummer uit de URL."
                    );
                }
                Object.assign(data, {
                    bunniOfferteId: body.offerteId,
                    bunniOfferteNummer: number,
                    bunniOffertePdfUrl:
                        typeof body.offertePdfUrl === "string"
                        && body.offertePdfUrl
                        ?
                        body.offertePdfUrl
                        :
                        null,
                });
            }
        }
    }

    if (body.factuurId !== undefined) {
        if (!body.factuurId) {
            Object.assign(data, factuurFields(null));
        } else {
            const doc = await getBunniDocument(body.factuurId);
            if (doc) {
                Object.assign(data, factuurFields(doc));
            } else {
                const number =
                    typeof body.factuurNumber === "string"
                    && body.factuurNumber.trim()
                    ?
                    body.factuurNumber.trim()
                    :
                    null;
                if (!number) {
                    throw new Error("Bunni-factuur niet gevonden");
                }
                Object.assign(data, {
                    bunniFactuurId: body.factuurId,
                    bunniFactuurNummer: number,
                    bunniFactuurPdfUrl:
                        typeof body.factuurPdfUrl === "string"
                        && body.factuurPdfUrl
                        ?
                        body.factuurPdfUrl
                        :
                        null,
                });
            }
        }
    }

    return data;
}
