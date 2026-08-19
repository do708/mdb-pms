/**
 * Converteer aanvraag-schermitems naar prefilled InstallatieRuimte[],
 * zodat de engineer de werkbon niet volledig opnieuw hoeft in te vullen.
 */

import type { AanvraagSchermItem } from "@/lib/aanvraag/installatieTypes";
import { isPlayerAansturing } from "@/lib/aanvraag/installatieTypes";
import type {
    InstallatieRuimte,
    InstallatieScherm,
    BeugelType,
    Werkzaamheid,
    Orientatie,
    StroomInternetBlok,
} from "@/types/installatieRuimtes";
import { emptyScherm, emptyStroomInternet } from "@/types/installatieRuimtes";

function uid(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapBeugelType(item: AanvraagSchermItem): {
    werkzaamheid: Werkzaamheid;
    beugelType: BeugelType | "";
    beugelMaat: string;
} {
    const detail = (item.bevestigingDetail || "").toLowerCase();
    const hoofdcat = (item.beugel || "").toLowerCase();

    if (hoofdcat.includes("plafond")) {
        return {
            werkzaamheid: "plafond",
            beugelType: "plafond",
            beugelMaat: item.plafondHoogte || "",
        };
    }

    if (hoofdcat.includes("vloer")) {
        return {
            werkzaamheid: "vloerstaander",
            beugelType: "vloerstandaard",
            beugelMaat: "",
        };
    }

    // Muurbeugel subtypes
    if (detail.includes("kantel")) {
        return { werkzaamheid: "wand", beugelType: "wand_kantelbaar", beugelMaat: "" };
    }
    if (detail.includes("draai") || detail.includes("zwenk")) {
        return { werkzaamheid: "wand", beugelType: "zwenk", beugelMaat: "" };
    }
    if (detail.includes("vast") || hoofdcat.includes("muur")) {
        return { werkzaamheid: "wand", beugelType: "wand_vast", beugelMaat: mapWandMaat(item.formaat) };
    }

    // Specials / Anders
    if (hoofdcat.includes("special") || detail) {
        return { werkzaamheid: "wand", beugelType: "geen", beugelMaat: "" };
    }

    return { werkzaamheid: "wand", beugelType: "", beugelMaat: "" };
}

function mapWandMaat(formaat: string): string {
    const inch = parseInt(formaat, 10);
    if (!inch) return "";
    if (inch <= 55) return 't/m 55"';
    if (inch <= 65) return '65"';
    if (inch <= 85) return '75"-85"';
    return '98"-100"';
}

function mapOrientatie(ori: string): Orientatie | "" {
    const lower = (ori || "").toLowerCase();
    if (lower.includes("portrait") || lower === "staand") return "portrait";
    if (lower.includes("landscape") || lower === "liggend") return "landscape";
    return "";
}

function mapFormaat(item: AanvraagSchermItem): string {
    if (item.formaat === "Anders") return item.formaatAnders || "";
    return item.formaat || "";
}

function beugelBeschrijving(item: AanvraagSchermItem): string {
    const parts: string[] = [];
    if (item.bevestigingDetail) parts.push(item.bevestigingDetail);
    else if (item.beugel) parts.push(item.beugel);
    if (item.bevestigingAnders) parts.push(item.bevestigingAnders);
    if (item.plafondHoogte) parts.push(item.plafondHoogte);
    return parts.join(" — ");
}

interface SchermGroup {
    locatie: string;
    items: AanvraagSchermItem[];
}

function groupByLocatie(items: AanvraagSchermItem[]): SchermGroup[] {
    const idToItem = new Map(items.map((i) => [i.id, i]));
    const groups = new Map<string, AanvraagSchermItem[]>();

    for (const item of items) {
        let locKey: string;
        if (item.naastSchermId) {
            const anchor = idToItem.get(item.naastSchermId);
            locKey = anchor?.locatie?.trim() || item.locatie?.trim() || "";
        } else {
            locKey = item.locatie?.trim() || "";
        }
        if (!groups.has(locKey)) groups.set(locKey, []);
        groups.get(locKey)!.push(item);
    }

    return [...groups.entries()].map(([locatie, items]) => ({
        locatie,
        items,
    }));
}

function deriveStroomInternet(
    items: AanvraagSchermItem[],
    field: "stroom" | "internet"
): StroomInternetBlok {
    const blok = emptyStroomInternet();
    const first = items[0];
    if (!first) return blok;

    const val = first[field];
    if (val === "Ja" || val === "Wifi") {
        blok.aanwezig = "Ja";
    } else if (val === "Nee") {
        blok.aanwezig = "Nee";
        const mdbField = field === "stroom" ? "stroomMdb" : "internetMdb";
        const afstandField = field === "stroom" ? "stroomAfstand" : "internetAfstand";
        const trajectField = field === "stroom" ? "stroomTraject" : "internetTraject";
        if (first[mdbField] === "Ja") {
            blok.mdbRealiseert = "Ja";
            blok.dichtstbijzijnde = first[afstandField] || "";
            blok.kabelTraject = first[trajectField] || "";
        } else if (first[mdbField] === "Nee") {
            blok.mdbRealiseert = "Nee";
        }
    }
    return blok;
}

export function prefillRuimtesVanAanvraag(
    aanvraagSpecificaties: unknown
): {
    ruimtes: InstallatieRuimte[];
    stroomBlok: StroomInternetBlok;
    internetBlok: StroomInternetBlok;
} | null {
    if (!aanvraagSpecificaties || typeof aanvraagSpecificaties !== "object") {
        return null;
    }

    const envelope = aanvraagSpecificaties as Record<string, unknown>;
    const specs =
        (envelope.specificaties as Record<string, unknown>) || envelope;
    const schermen = specs.schermen as Record<string, unknown> | undefined;

    if (!schermen?.aan || !Array.isArray(schermen.items) || schermen.items.length === 0) {
        return null;
    }

    const aanvraagItems = schermen.items as AanvraagSchermItem[];
    const groups = groupByLocatie(aanvraagItems);

    const ruimtes: InstallatieRuimte[] = groups.map((group, gi) => {
        const firstItem = group.items[0];
        const beugel = mapBeugelType(firstItem);

        const schermen: InstallatieScherm[] = group.items.map((item, si) => {
            const fm = mapFormaat(item);
            const aansturingLabel = isPlayerAansturing(item.aansturing)
                ? "Player"
                : item.aansturing === "Anders"
                  ? item.aansturingAnders || "Anders"
                  : item.aansturing || "";

            return {
                ...emptyScherm(si),
                label: `Scherm ${si + 1}`,
                formaat: fm,
                merkType: [
                    beugelBeschrijving(item),
                    aansturingLabel ? `Aansturing: ${aansturingLabel}` : "",
                ]
                    .filter(Boolean)
                    .join(" | "),
                serienummer: "",
                mac: "",
            };
        });

        return {
            id: uid(),
            naam: group.locatie || (groups.length > 1 ? `Ruimte ${gi + 1}` : ""),
            werkzaamheid: beugel.werkzaamheid,
            beugelType: beugel.beugelType,
            beugelMaat: beugel.beugelMaat,
            actie: "nieuw" as const,
            orientatie: mapOrientatie(firstItem.orientatie),
            aantalSchermen: schermen.length,
            schermen,
        };
    });

    const stroomBlok = deriveStroomInternet(aanvraagItems, "stroom");
    const internetBlok = deriveStroomInternet(aanvraagItems, "internet");

    return { ruimtes, stroomBlok, internetBlok };
}
