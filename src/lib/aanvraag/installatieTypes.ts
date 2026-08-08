/**
 * Installatietype-codes o.b.v. Productoverzicht & Tarieven (MC-xx).
 *
 * Codes hangen af van bevestiging + schermformaat:
 * - Wand tot 55" → 03 | Wand 65" → 05 | Wand 75–85" → 06 | Wand 98–100" → 07
 * - Vloerstaander tot 55" → 04
 * - Plafond tot 55" → 08 | Plafond 65–85" → 09
 *
 * Over de hele aanvraag: grootste scherm = hoofdtype; overige (ook aparte
 * locatie) = zelfde code + "v" (vervolg-installatie, MC-xxv).
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
        "Vloer-plafond standaard",
        "Mobiele vloerstandaard (trolley)",
    ],
};

/** @deprecated gebruik BEVESTIGING_OPTIES */
export const BEUGEL_OPTIES = BEVESTIGING_OPTIES;

/** Kabeltraject-keuzes bij MDB-realisatie (aanvraag schermen). */
export const KABEL_TRAJECT_OPTIES = [
    "Systeemplafond",
    "Langs de wand",
] as const;

export type KabelTraject = (typeof KABEL_TRAJECT_OPTIES)[number];

/**
 * Formaatbanden uit het productoverzicht (geen prijzen).
 * 86" valt onder “75 tot 85” (dichtstbijzijnde standaardcode).
 */
export type FormaatBand = "tot55" | "65" | "75-85" | "98-100";

export function formaatBand(inch: number): FormaatBand | "" {
    if (!inch || inch < 1) {
        return "";
    }
    if (inch <= 55) {
        return "tot55";
    }
    if (inch <= 65) {
        return "65";
    }
    if (inch <= 90) {
        return "75-85";
    }
    if (inch <= 100) {
        return "98-100";
    }
    return "";
}

/**
 * Basis-typecode (zonder v) o.b.v. bevestiging + formaatband.
 * MC-01/02 (video-/radiospeler) zijn geen scherminstallaties.
 */
export function typeCodeVoorBevestigingEnBand(
    bevestiging: string,
    band: FormaatBand | ""
): string {
    if (!bevestiging || !band) {
        return "";
    }

    if (bevestiging === "Muurbeugel") {
        switch (band) {
            case "tot55":
                return "03";
            case "65":
                return "05";
            case "75-85":
                return "06";
            case "98-100":
                return "07";
            default:
                return "";
        }
    }

    if (bevestiging === "Vloerstandaard") {
        return band === "tot55" ? "04" : "";
    }

    if (bevestiging === "Plafondbeugel") {
        switch (band) {
            case "tot55":
                return "08";
            case "65":
            case "75-85":
                return "09";
            default:
                return "";
        }
    }

    return "";
}

/** Fallback size→code voor wand (alleen als bevestiging ontbreekt in oude data). */
export const TYPE_CODE_PER_FORMAAT: Record<string, string> = {
    '32"': "03",
    '43"': "03",
    '49"': "03",
    '50"': "03",
    '55"': "03",
    '65"': "05",
    '75"': "06",
    '86"': "06",
    '98"': "07",
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
    /** Alleen bij stroom === "Nee": wil MDB dit realiseren? */
    stroomMdb: "" | "Ja" | "Nee" | string;
    /** Geschatte afstand in meters (alleen bij stroomMdb === "Ja") */
    stroomAfstand: string;
    /** Traject: Systeemplafond | Langs de wand (alleen bij stroomMdb === "Ja") */
    stroomTraject: string;
    internet: "" | "Ja" | "Wifi" | "Nee";
    /** Alleen bij internet === "Nee": wil MDB dit realiseren? */
    internetMdb: "" | "Ja" | "Nee" | string;
    /** Geschatte afstand in meters (alleen bij internetMdb === "Ja") */
    internetAfstand: string;
    /** Traject: Systeemplafond | Langs de wand (alleen bij internetMdb === "Ja") */
    internetTraject: string;
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
        stroomAfstand: "",
        stroomTraject: "",
        internet: "",
        internetMdb: "",
        internetAfstand: "",
        internetTraject: "",
    };
}

/** Velden die een gekoppeld scherm overneemt van het anker. */
export type SchermVoorzieningen = Pick<
    AanvraagSchermItem,
    | "formaat"
    | "formaatAnders"
    | "beugel"
    | "bevestigingDetail"
    | "orientatie"
    | "locatie"
    | "stroom"
    | "stroomMdb"
    | "stroomAfstand"
    | "stroomTraject"
    | "internet"
    | "internetMdb"
    | "internetAfstand"
    | "internetTraject"
>;

export function voorzieningenVan(
    anker: AanvraagSchermItem
): SchermVoorzieningen {
    return {
        formaat: anker.formaat,
        formaatAnders: anker.formaatAnders,
        beugel: anker.beugel,
        bevestigingDetail: anker.bevestigingDetail,
        orientatie: anker.orientatie,
        locatie: anker.locatie,
        stroom: anker.stroom,
        stroomMdb: anker.stroomMdb,
        stroomAfstand: anker.stroomAfstand,
        stroomTraject: anker.stroomTraject,
        internet: anker.internet,
        internetMdb: anker.internetMdb,
        internetAfstand: anker.internetAfstand,
        internetTraject: anker.internetTraject,
    };
}

/** Lege voorzieningen — o.a. bij overstap naar Eigen locatie. */
export function legeVoorzieningen(): SchermVoorzieningen {
    return {
        formaat: "",
        formaatAnders: "",
        beugel: "",
        bevestigingDetail: "",
        orientatie: "",
        locatie: "",
        stroom: "",
        stroomMdb: "",
        stroomAfstand: "",
        stroomTraject: "",
        internet: "",
        internetMdb: "",
        internetAfstand: "",
        internetTraject: "",
    };
}

/** Of een scherm (niet-gekoppeld) alle verplichte velden heeft. */
export function schermVeldenCompleet(
    scherm: AanvraagSchermItem
): boolean {
    if (
        !scherm.formaat
        || !scherm.beugel
        || !scherm.orientatie
        || !scherm.locatie.trim()
        || !scherm.stroom
        || !scherm.internet
    ) {
        return false;
    }

    if (
        scherm.beugel in BEVESTIGING_DETAIL
        && !scherm.bevestigingDetail
    ) {
        return false;
    }

    return true;
}

const VOORZIENING_KEYS: (keyof SchermVoorzieningen)[] = [
    "formaat",
    "formaatAnders",
    "beugel",
    "bevestigingDetail",
    "orientatie",
    "locatie",
    "stroom",
    "stroomMdb",
    "stroomAfstand",
    "stroomTraject",
    "internet",
    "internetMdb",
    "internetAfstand",
    "internetTraject",
];

export function patchRaaktVoorzieningen(
    patch: Partial<AanvraagSchermItem>
): boolean {
    return VOORZIENING_KEYS.some((k) => k in patch);
}

/**
 * Formaat, bevestiging, oriëntatie, locatie + stroom/internet
 * van elk gekoppeld scherm opnieuw zetten o.b.v. het anker.
 */
export function syncVoorzieningenVanAnkers(
    items: AanvraagSchermItem[]
): AanvraagSchermItem[] {
    return items.map((s) => {
        if (!s.naastSchermId) {
            return s;
        }
        const anker = resolveAnker(s, items);
        if (anker.id === s.id) {
            return s;
        }
        return { ...s, ...voorzieningenVan(anker) };
    });
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
        }
        next.push(nieuw);
    }

    while (next.length > n) {
        next.pop();
    }

    const ids = new Set(next.map((s) => s.id));

    const metLinks = next.map((s, i) => {
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

        return {
            ...s,
            naastSchermId: naast,
        };
    });

    return syncVoorzieningenVanAnkers(metLinks);
}

/** Basis-typecode voor een schermitem (bevestiging + formaat; geen v). */
export function basisTypeCode(
    itemOrFormaat: AanvraagSchermItem | string,
    beugel?: string
): string {
    // Oude aanroep: basisTypeCode(formaat) — alleen formaat, wand-aanname
    if (typeof itemOrFormaat === "string") {
        const formaat = itemOrFormaat;
        if (!formaat || formaat === "Anders") {
            return "";
        }
        if (beugel) {
            const inchMatch = formaat.match(/(\d+)/);
            const inch = inchMatch ? parseInt(inchMatch[1], 10) : 0;
            return typeCodeVoorBevestigingEnBand(beugel, formaatBand(inch));
        }
        return TYPE_CODE_PER_FORMAAT[formaat] || "";
    }

    const item = itemOrFormaat;
    const inch = formaatInch(item);
    if (!inch) {
        return "";
    }
    if (!item.beugel) {
        // Zonder bevestiging nog geen betrouwbare MC-code
        return "";
    }
    return typeCodeVoorBevestigingEnBand(item.beugel, formaatBand(inch));
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
 * Over de hele aanvraag: alleen het grootste scherm = vol type.
 * Alle overige schermen (ook “aparte locatie”) = type + "v".
 */
export function berekendInstallatieType(
    item: AanvraagSchermItem,
    alle: AanvraagSchermItem[]
): string {
    const basis = basisTypeCode(item);

    if (!basis) {
        return "";
    }

    const metFormaat = alle.filter((s) => formaatInch(s) > 0);

    if (metFormaat.length <= 1) {
        return basis;
    }

    const hoofdId = hoofdSchermId(metFormaat, alle);

    if (item.id === hoofdId) {
        return basis;
    }

    return `${basis}v`;
}

export function isHoofdType(
    item: AanvraagSchermItem,
    alle: AanvraagSchermItem[]
): boolean {
    const metFormaat = alle.filter((s) => formaatInch(s) > 0);

    if (metFormaat.length <= 1) {
        return true;
    }

    return item.id === hoofdSchermId(metFormaat, alle);
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

function mdbSamenvatting(
    mdb: string,
    afstand: string,
    traject: string
): string {
    if (!mdb) return "";
    if (mdb !== "Ja") return ` (MDB: ${mdb})`;
    const details = [
        afstand ? `afstand ${afstand}` : "",
        traject || "",
    ].filter(Boolean);
    return details.length > 0
        ? ` (MDB: Ja — ${details.join(", ")})`
        : " (MDB: Ja)";
}

export function samenvattingStroomInternet(
    items: AanvraagSchermItem[]
): { stroom: string; internet: string } {
    const stroomDelen = items
        .map((s, i) => {
            if (!s.stroom) return "";
            const mdb =
                s.stroom === "Nee"
                    ? mdbSamenvatting(
                          s.stroomMdb,
                          s.stroomAfstand,
                          s.stroomTraject
                      )
                    : "";
            return `Scherm ${i + 1}: ${s.stroom}${mdb}`;
        })
        .filter(Boolean);

    const internetDelen = items
        .map((s, i) => {
            if (!s.internet) return "";
            const mdb =
                s.internet === "Nee"
                    ? mdbSamenvatting(
                          s.internetMdb,
                          s.internetAfstand,
                          s.internetTraject
                      )
                    : "";
            return `Scherm ${i + 1}: ${s.internet}${mdb}`;
        })
        .filter(Boolean);

    return {
        stroom: stroomDelen.join("; "),
        internet: internetDelen.join("; "),
    };
}
