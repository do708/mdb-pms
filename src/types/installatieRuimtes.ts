/** Ruimtes/schermen-structuur voor digital-signage werkbon (OpleverForm). */

export type Werkzaamheid =
    | "wand"
    | "plafond"
    | "vloerstaander"
    | "videowall"
    | "swap"
    | "mediaplayer";

export type BeugelType =
    | "wand_vast"
    | "wand_kantelbaar"
    | "zwenk"
    | "plafond"
    | "vloerstandaard"
    | "geen";

export type Actie =
    | "nieuw"
    | "hergebruikt"
    | "gedemonteerd";

export type Orientatie = "landscape" | "portrait";

export interface InstallatieScherm {
    id: string;
    label: string;
    fotoUrl: string;
    formaat: string;
    formaatAnders: string;
    beugel: string;
    bevestigingDetail: string;
    bevestigingAnders: string;
    plafondHoogte: string;
    aansturing: string;
    aansturingAnders: string;
    orientatie: string;
    locatie: string;
    stroom: "" | "Ja" | "Nee";
    stroomGerealiseerd: "" | "Ja" | "Nee";
    stroomMeter: string;
    stroomTraject: string;
    internet: "" | "Ja" | "Wifi" | "Nee";
    internetGerealiseerd: "" | "Ja" | "Nee";
    internetMeter: string;
    internetTraject: string;
    merkType: string;
    serienummer: string;
    mac: string;
    playerFotoUrl: string;
    playerMerkType: string;
    playerSerienummer: string;
    playerMac: string;
}

export interface InstallatieRuimte {
    id: string;
    naam: string;
    werkzaamheid: Werkzaamheid | "";
    beugelType: BeugelType | "";
    beugelMaat: string;
    actie: Actie | "";
    orientatie: Orientatie | "";
    aantalSchermen: number;
    schermen: InstallatieScherm[];
}

/** @deprecated alias — oude naam */
export type AanvraagScherm = InstallatieScherm;
/** @deprecated alias — oude naam */
export type AanvraagRuimte = InstallatieRuimte;

export interface StroomInternetBlok {
    aanwezig: "" | "Ja" | "Nee";
    mdbRealiseert: "" | "Ja" | "Nee";
    dichtstbijzijnde: string;
    kabelTraject: string;
}

export interface ExtraDiensten {
    afvoerTm50: boolean;
    afvoerTm50Aantal: string;
    afvoerVanaf50: boolean;
    afvoerVanaf50Aantal: string;
    afval: boolean;
    afvalAantal: string;
    audio: boolean;
    project: boolean;
}

export const WERKZAAMHEID_OPTIES: {
    value: Werkzaamheid;
    label: string;
}[] = [
    { value: "wand", label: "Wand installatie" },
    { value: "plafond", label: "Plafond installatie" },
    { value: "vloerstaander", label: "Vloerstaander installatie" },
    { value: "videowall", label: "Videowall installatie" },
    { value: "swap", label: "Scherm swap (vervanging)" },
    {
        value: "mediaplayer",
        label: "Alleen mediaplayer / radiospeler installeren",
    },
];

export const BEUGEL_OPTIES: { value: BeugelType; label: string }[] = [
    { value: "wand_vast", label: "Wandsteun vast" },
    { value: "wand_kantelbaar", label: "Wandsteun kantelbaar" },
    { value: "zwenk", label: "Draaibare / Zwenkbeugel" },
    { value: "plafond", label: "Plafondsteun Fixed" },
    { value: "vloerstandaard", label: "Vloerstandaard" },
    { value: "geen", label: "Geen beugel nodig / Aanwezig" },
];

export const WAND_VAST_MATEN = [
    't/m 55"',
    '65"',
    '75"-85"',
    '98"-100"',
];

export const PLAFOND_MATEN = ["80cm", "150cm", "300cm"];

export const SCHERM_FORMATEN = [
    '32"',
    '43"',
    '55"',
    '65"',
    '75"',
    '85"',
    '98"+',
];

export const KABEL_TRAJECT_STROOM = [
    "Via systeemplafond",
    "Via de wand (opbouw/koker)",
    "Anders",
];

export const KABEL_TRAJECT_INTERNET = [
    "Via systeemplafond",
    "Via de wand (opbouw/koker)",
    "Wi-Fi gewenst",
];

/** Kabeltraject-keuzes op de werkbon (stroom/internet per scherm). */
export const KABEL_TRAJECT_P25 = ["P25 - Wand", "Systeemplafond"] as const;

const P25_WAND_OUD = new Set(["P25 wand", "P25 Wand"]);

/** Oude opgeslagen labels naar de huidige naam. */
export function normalizeP25WandTraject(value: string): string {
    if (P25_WAND_OUD.has(value)) {
        return "P25 - Wand";
    }
    return value;
}

function uid(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Letters A–F (en overige letters) naar hoofdletters; spaties/kolons blijven. */
export function normalizeMac(value: string): string {
    return (value || "").toUpperCase();
}

/** Of een scherm al specificaties heeft om over te nemen. */
export function schermHeeftGegevens(s: InstallatieScherm): boolean {
    return Boolean(
        s.formaat
        || (s.formaatAnders || "").trim()
        || s.beugel
        || s.bevestigingDetail
        || (s.bevestigingAnders || "").trim()
        || s.plafondHoogte
        || s.aansturing
        || (s.aansturingAnders || "").trim()
        || s.orientatie
        || (s.locatie || "").trim()
        || s.stroom
        || s.stroomGerealiseerd
        || (s.stroomMeter || "").trim()
        || s.stroomTraject
        || s.internet
        || s.internetGerealiseerd
        || (s.internetMeter || "").trim()
        || s.internetTraject
        || (s.merkType || "").trim()
        || (s.serienummer || "").trim()
        || (s.mac || "").trim()
        || (s.playerMerkType || "").trim()
        || (s.playerSerienummer || "").trim()
        || (s.playerMac || "").trim()
    );
}

/** Specificaties van een scherm, zonder identiteit/foto. */
export function specsVanScherm(
    s: InstallatieScherm
): Omit<InstallatieScherm, "id" | "label" | "fotoUrl" | "playerFotoUrl"> {
    return {
        formaat: s.formaat,
        formaatAnders: s.formaatAnders,
        beugel: s.beugel,
        bevestigingDetail: s.bevestigingDetail,
        bevestigingAnders: s.bevestigingAnders,
        plafondHoogte: s.plafondHoogte,
        aansturing: s.aansturing,
        aansturingAnders: s.aansturingAnders,
        orientatie: s.orientatie,
        locatie: s.locatie,
        stroom: s.stroom,
        stroomGerealiseerd: s.stroomGerealiseerd,
        stroomMeter: s.stroomMeter,
        stroomTraject: normalizeP25WandTraject(s.stroomTraject),
        internet: s.internet,
        internetGerealiseerd: s.internetGerealiseerd,
        internetMeter: s.internetMeter,
        internetTraject: normalizeP25WandTraject(s.internetTraject),
        merkType: s.merkType,
        serienummer: s.serienummer,
        mac: normalizeMac(s.mac),
        playerMerkType: s.playerMerkType,
        playerSerienummer: s.playerSerienummer,
        playerMac: normalizeMac(s.playerMac),
    };
}

export function emptyScherm(
    index: number,
    label = ""
): InstallatieScherm {
    return {
        id: uid(),
        label:
            label ||
            (index === 0 ? "Scherm 1" : `Scherm ${index + 1}`),
        fotoUrl: "",
        formaat: "",
        formaatAnders: "",
        beugel: "",
        bevestigingDetail: "",
        bevestigingAnders: "",
        plafondHoogte: "",
        aansturing: "",
        aansturingAnders: "",
        orientatie: "",
        locatie: "",
        stroom: "",
        stroomGerealiseerd: "",
        stroomMeter: "",
        stroomTraject: "",
        internet: "",
        internetGerealiseerd: "",
        internetMeter: "",
        internetTraject: "",
        merkType: "",
        serienummer: "",
        mac: "",
        playerFotoUrl: "",
        playerMerkType: "",
        playerSerienummer: "",
        playerMac: "",
    };
}

export function emptyRuimte(): InstallatieRuimte {
    return {
        id: uid(),
        naam: "",
        werkzaamheid: "",
        beugelType: "",
        beugelMaat: "",
        actie: "",
        orientatie: "",
        aantalSchermen: 1,
        schermen: [emptyScherm(0)],
    };
}

export function emptyStroomInternet(): StroomInternetBlok {
    return {
        aanwezig: "",
        mdbRealiseert: "",
        dichtstbijzijnde: "",
        kabelTraject: "",
    };
}

export function emptyExtra(): ExtraDiensten {
    return {
        afvoerTm50: false,
        afvoerTm50Aantal: "",
        afvoerVanaf50: false,
        afvoerVanaf50Aantal: "",
        afval: false,
        afvalAantal: "",
        audio: false,
        project: false,
    };
}

export function syncSchermen(
    ruimte: InstallatieRuimte,
    aantal: number
): InstallatieRuimte {
    const n = Math.max(1, Math.min(12, aantal));
    const schermen = [...ruimte.schermen];

    while (schermen.length < n) {
        schermen.push(emptyScherm(schermen.length));
    }

    while (schermen.length > n) {
        schermen.pop();
    }

    return {
        ...ruimte,
        aantalSchermen: n,
        schermen: schermen.map((s, i) => ({
            ...s,
            label: s.label || `Scherm ${i + 1}`,
        })),
    };
}

export function werkzaamheidLabel(
    value: string
): string {
    return (
        WERKZAAMHEID_OPTIES.find((o) => o.value === value)?.label ??
        value
    );
}

export function beugelLabel(value: string): string {
    return BEUGEL_OPTIES.find((o) => o.value === value)?.label ?? value;
}

/** Leesbare samenvatting voor dashboard / werkbon. */
export function summarizeRuimtes(
    ruimtes: InstallatieRuimte[] | unknown
): string[] {
    if (!Array.isArray(ruimtes)) {
        return [];
    }

    return ruimtes.map((r, i) => {
        const naam = r.naam?.trim() || `Ruimte ${i + 1}`;
        const werk = r.werkzaamheid
            ? werkzaamheidLabel(r.werkzaamheid)
            : "—";
        const n = r.aantalSchermen || r.schermen?.length || 0;
        const beugel = r.beugelType
            ? beugelLabel(r.beugelType) +
              (r.beugelMaat ? ` (${r.beugelMaat})` : "")
            : "";
        const parts = [
            naam,
            werk,
            n ? `${n} scherm${n === 1 ? "" : "en"}` : "",
            beugel,
            r.orientatie,
            r.actie,
        ].filter(Boolean);

        return parts.join(" · ");
    });
}

export function summarizeVoorziening(
    label: string,
    blok: StroomInternetBlok | undefined
): string {
    if (!blok?.aanwezig) {
        return "";
    }

    if (blok.aanwezig === "Ja") {
        return `${label}: Ja`;
    }

    const mdb =
        blok.mdbRealiseert === "Ja"
            ? `MDB realiseert${blok.dichtstbijzijnde ? ` (${blok.dichtstbijzijnde})` : ""}${blok.kabelTraject ? `, ${blok.kabelTraject}` : ""}`
            : blok.mdbRealiseert === "Nee"
              ? "klant regelt zelf"
              : "";

    return `${label}: Nee${mdb ? ` — ${mdb}` : ""}`;
}
