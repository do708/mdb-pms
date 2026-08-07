/**
 * Installatietype-codes op basis van schermformaat.
 * Eerste scherm op een locatie = vol type (bijv. 05).
 * Extra scherm op dezelfde locatie = type + "v" (bijv. 04v).
 *
 * Mapping volgt MDB-voorbeeld: 65" → 05, 55" → 04.
 * Pas aan als de prijslijst/PDF andere codes heeft.
 */

export const SCHERM_FORMATEN = [
    '32"',
    '43"',
    '49"',
    '50"',
    '55"',
    '65"',
    '75"',
    '86"',
    "Anders",
] as const;

/** Pastelkleuren per formaat (chips). */
export const FORMAAT_PASTEL: Record<string, { bg: string; border: string; text: string }> = {
    '32"': { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-900" },
    '43"': { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-900" },
    '49"': { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-900" },
    '50"': { bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-900" },
    '55"': { bg: "bg-lime-100", border: "border-lime-300", text: "text-lime-900" },
    '65"': { bg: "bg-sky-100", border: "border-sky-300", text: "text-sky-900" },
    '75"': { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-900" },
    '86"': { bg: "bg-fuchsia-100", border: "border-fuchsia-300", text: "text-fuchsia-900" },
    Anders: { bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-800" },
};

export const BEUGEL_OPTIES = [
    "Muurbeugel",
    "Zwenkbeugel",
    "Plafondbeugel 150cm",
    "Plafondbeugel 300cm",
    "Vloerstandaard",
    "Overig",
] as const;

/** Basis-typecode per inch (zonder v-suffix). */
export const TYPE_CODE_PER_FORMAAT: Record<string, string> = {
    '32"': "01",
    '43"': "02",
    '49"': "03",
    '50"': "03",
    '55"': "04",
    '65"': "05",
    '75"': "06",
    '86"': "07",
};

export interface AanvraagSchermItem {
    id: string;
    formaat: string;
    formaatAnders: string;
    beugel: string;
    orientatie: string;
    locatie: string;
    /** Leeg = start nieuwe locatie (vol type). Anders id van het ankerscherm. */
    naastSchermId: string;
    stroom: "" | "Ja" | "Nee";
    stroomMdb: string;
    internet: "" | "Ja" | "Nee";
    internetMdb: string;
}

function uid(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptySchermItem(): AanvraagSchermItem {
    return {
        id: uid(),
        formaat: "",
        formaatAnders: "",
        beugel: "",
        orientatie: "",
        locatie: "",
        naastSchermId: "",
        stroom: "",
        stroomMdb: "",
        internet: "",
        internetMdb: "",
    };
}

export function syncSchermItems(
    items: AanvraagSchermItem[],
    aantal: number
): AanvraagSchermItem[] {
    const n = Math.max(0, Math.min(20, aantal));
    const next = [...items];

    while (next.length < n) {
        next.push(emptySchermItem());
    }

    while (next.length > n) {
        next.pop();
    }

    // Verwijder verwijzingen naar niet-bestaande schermen
    const ids = new Set(next.map((s) => s.id));

    return next.map((s, i) => {
        let naast = s.naastSchermId;

        if (naast && !ids.has(naast)) {
            naast = "";
        }

        // Mag niet naar zichzelf of naar een later scherm (alleen eerdere)
        if (naast) {
            const targetIndex = next.findIndex((x) => x.id === naast);
            if (targetIndex < 0 || targetIndex >= i) {
                naast = "";
            }
        }

        return { ...s, naastSchermId: naast };
    });
}

export function basisTypeCode(formaat: string): string {
    if (!formaat || formaat === "Anders") {
        return "";
    }

    return TYPE_CODE_PER_FORMAAT[formaat] || "";
}

/**
 * Bepaalt of dit scherm het eerste is op zijn locatiegroep.
 * Eerste = vol type; gekoppeld aan eerder scherm = type + "v".
 */
export function berekendInstallatieType(
    item: AanvraagSchermItem,
    alle: AanvraagSchermItem[]
): string {
    const basis = basisTypeCode(item.formaat);

    if (!basis) {
        return "";
    }

    const isVervolg = Boolean(item.naastSchermId);

    // Ook: zelfde locatietekst als een eerder scherm → vervolg
    const loc = item.locatie.trim().toLowerCase();
    let zelfdeLocatieAlsEerder = false;

    if (!isVervolg && loc) {
        const index = alle.findIndex((s) => s.id === item.id);
        zelfdeLocatieAlsEerder = alle
            .slice(0, Math.max(0, index))
            .some(
                (s) =>
                    !s.naastSchermId &&
                    s.locatie.trim().toLowerCase() === loc
            );
    }

    if (isVervolg || zelfdeLocatieAlsEerder) {
        return `${basis}v`;
    }

    return basis;
}

export function samenvattingSchermen(
    items: AanvraagSchermItem[]
): string {
    if (items.length === 0) {
        return "";
    }

    return items
        .map((s, i) => {
            const type = berekendInstallatieType(s, items);
            const formaat =
                s.formaat === "Anders"
                    ? s.formaatAnders || "Anders"
                    : s.formaat;
            const parts = [
                `Scherm ${i + 1}`,
                formaat,
                s.beugel,
                s.orientatie,
                s.locatie ? `@ ${s.locatie}` : "",
                type ? `type ${type}` : "",
            ].filter(Boolean);

            return parts.join(" · ");
        })
        .join("; ");
}

export function samenvattingStroomInternet(
    items: AanvraagSchermItem[]
): { stroom: string; internet: string } {
    const stroomDelen = items
        .map((s, i) => {
            if (!s.stroom) return "";
            const mdb =
                s.stroom === "Nee" && s.stroomMdb
                    ? ` (MDB: ${s.stroomMdb})`
                    : "";
            return `Scherm ${i + 1}: ${s.stroom}${mdb}`;
        })
        .filter(Boolean);

    const internetDelen = items
        .map((s, i) => {
            if (!s.internet) return "";
            const mdb =
                s.internet === "Nee" && s.internetMdb
                    ? ` (MDB: ${s.internetMdb})`
                    : "";
            return `Scherm ${i + 1}: ${s.internet}${mdb}`;
        })
        .filter(Boolean);

    return {
        stroom: stroomDelen.join("; "),
        internet: internetDelen.join("; "),
    };
}
