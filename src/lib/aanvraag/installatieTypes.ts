/**
 * Installatietype-codes op basis van schermformaat + locatie.
 *
 * Per locatie:
 * - grootste scherm = hoofdtype (bijv. 86"/98" → 07/08)
 * - overige schermen op diezelfde locatie = vervolgtype met "v" (bijv. 55" → 04v)
 *
 * Mapping volgt MDB-voorbeeld: 65" → 05, 55" → 04.
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
    '98"',
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
    '98"': { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-900" },
};

export const BEVESTIGING_OPTIES = [
    "Muurbeugel",
    "Plafondbeugel",
    "Vloerstandaard",
] as const;

export type BevestigingSoort = (typeof BEVESTIGING_OPTIES)[number];

export const BEVESTIGING_DETAIL: Record<BevestigingSoort, string[]> = {
    Muurbeugel: [
        "Vaste muurbeugel",
        "Kantelbare muurbeugel",
        "Draaibare muurbeugel",
    ],
    Plafondbeugel: [
        "Vaste plafondbeugel",
        "Vaste plafondbeugel kantelbare scherm",
    ],
    Vloerstandaard: [
        "Vaste vloerstandaard",
        "Mobiele vloerstandaard (trolley)",
        "Vloer-plafond standaard",
    ],
};

/** @deprecated gebruik BEVESTIGING_OPTIES */
export const BEUGEL_OPTIES = BEVESTIGING_OPTIES;

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
    '98"': "08",
};

export interface AanvraagSchermItem {
    id: string;
    formaat: string;
    formaatAnders: string;
    /** Hoofdcategorie: Muurbeugel / Plafondbeugel / Vloerstandaard */
    beugel: string;
    /** Specifieke bevestiging binnen de categorie */
    bevestigingDetail: string;
    orientatie: string;
    locatie: string;
    /**
     * Zelfde locatie als een ander scherm (groep).
     * Leeg = eigen locatieveld bepaalt de groep.
     */
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
        bevestigingDetail: "",
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
        const nieuw = emptySchermItem();
        // Standaard: koppel aan eerste scherm (zelfde locatie / vervolg).
        if (next.length > 0) {
            nieuw.naastSchermId = next[0].id;
            nieuw.locatie = next[0].locatie;
        }
        next.push(nieuw);
    }

    while (next.length > n) {
        next.pop();
    }

    const ids = new Set(next.map((s) => s.id));

    return next.map((s, i) => {
        let naast = s.naastSchermId;

        if (naast && !ids.has(naast)) {
            naast = "";
        }

        // Mag niet naar zichzelf wijzen
        if (naast === s.id) {
            naast = "";
        }

        // Standaard actief voor scherm 2+: koppel aan scherm 1 als leeg
        if (i > 0 && !naast && next[0]) {
            naast = next[0].id;
        }

        const anker = naast
            ? next.find((x) => x.id === naast)
            : undefined;

        return {
            ...s,
            naastSchermId: naast,
            locatie: anker ? anker.locatie : s.locatie,
        };
    });
}

export function basisTypeCode(formaat: string): string {
    if (!formaat || formaat === "Anders") {
        return "";
    }

    return TYPE_CODE_PER_FORMAAT[formaat] || "";
}

/** Inch-waarde voor grootte-vergelijking (85" > 55"). */
export function formaatInch(item: AanvraagSchermItem): number {
    const raw =
        item.formaat === "Anders"
            ? item.formaatAnders
            : item.formaat;
    const match = String(raw || "").match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

function resolveAnker(
    item: AanvraagSchermItem,
    alle: AanvraagSchermItem[]
): AanvraagSchermItem {
    let cur = item;
    const seen = new Set<string>();

    while (cur.naastSchermId && !seen.has(cur.id)) {
        seen.add(cur.id);
        const next = alle.find((s) => s.id === cur.naastSchermId);
        if (!next) {
            break;
        }
        cur = next;
    }

    return cur;
}

/**
 * Groepssleutel: zelfde locatienaam óf gekoppeld via “monteren naast”.
 * Anker + alle gekoppelde schermen delen altijd dezelfde sleutel.
 */
export function locatieGroepKey(
    item: AanvraagSchermItem,
    alle: AanvraagSchermItem[]
): string {
    const anker = resolveAnker(item, alle);
    const loc =
        (item.locatie || anker.locatie).trim().toLowerCase();

    if (loc) {
        return `loc:${loc}`;
    }

    // Lege locatie: hele keten (anker + gekoppelde) = één groep
    return `anker:${anker.id}`;
}

export function schermenOpLocatie(
    item: AanvraagSchermItem,
    alle: AanvraagSchermItem[]
): AanvraagSchermItem[] {
    const key = locatieGroepKey(item, alle);
    return alle.filter((s) => locatieGroepKey(s, alle) === key);
}

/** Grootste scherm in een lijst (= enige hoofdtype). */
export function hoofdSchermId(
    groep: AanvraagSchermItem[],
    alle: AanvraagSchermItem[]
): string {
    let bestId = groep[0]?.id || "";
    let bestSize = -1;
    let bestIndex = Number.POSITIVE_INFINITY;

    for (const s of groep) {
        const size = formaatInch(s);
        const idx = alle.findIndex((x) => x.id === s.id);

        if (
            size > bestSize ||
            (size === bestSize && idx < bestIndex)
        ) {
            bestSize = size;
            bestIndex = idx;
            bestId = s.id;
        }
    }

    return bestId;
}

/** @deprecated alias */
export function hoofdSchermIdOpLocatie(
    item: AanvraagSchermItem,
    alle: AanvraagSchermItem[]
): string {
    return hoofdSchermId(schermenOpLocatie(item, alle), alle);
}

/**
 * Per locatiegroep: alleen het grootste scherm = vol type.
 * Alle overige schermen in die groep = type + "v".
 * Zo is er altijd precies één hoofdtype per opstelling.
 */
export function berekendInstallatieType(
    item: AanvraagSchermItem,
    alle: AanvraagSchermItem[]
): string {
    const basis = basisTypeCode(item.formaat);

    if (!basis) {
        return "";
    }

    const groep = schermenOpLocatie(item, alle);

    if (groep.length <= 1) {
        return basis;
    }

    const hoofdId = hoofdSchermId(groep, alle);

    if (item.id === hoofdId) {
        return basis;
    }

    return `${basis}v`;
}

export function isHoofdType(
    item: AanvraagSchermItem,
    alle: AanvraagSchermItem[]
): boolean {
    const groep = schermenOpLocatie(item, alle);

    if (groep.length <= 1) {
        return true;
    }

    return item.id === hoofdSchermId(groep, alle);
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
                s.bevestigingDetail || s.beugel,
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
