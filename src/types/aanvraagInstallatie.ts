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

export interface AanvraagScherm {
    id: string;
    label: string;
    fotoUrl: string;
    formaat: string;
    merkType: string;
    serienummer: string;
    mac: string;
}

export interface AanvraagRuimte {
    id: string;
    naam: string;
    werkzaamheid: Werkzaamheid | "";
    beugelType: BeugelType | "";
    beugelMaat: string;
    actie: Actie | "";
    orientatie: Orientatie | "";
    aantalSchermen: number;
    schermen: AanvraagScherm[];
}

export interface StroomInternetBlok {
    aanwezig: "" | "Ja" | "Nee";
    mdbRealiseert: "" | "Ja" | "Nee";
    dichtstbijzijnde: string;
    kabelTraject: string;
}

export interface ExtraDiensten {
    afvoerTm50: boolean;
    afvoerVanaf50: boolean;
    afval: boolean;
    audio: boolean;
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

function uid(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyScherm(
    index: number,
    label = ""
): AanvraagScherm {
    return {
        id: uid(),
        label:
            label ||
            (index === 0 ? "Scherm 1" : `Scherm ${index + 1}`),
        fotoUrl: "",
        formaat: "",
        merkType: "",
        serienummer: "",
        mac: "",
    };
}

export function emptyRuimte(): AanvraagRuimte {
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
        afvoerVanaf50: false,
        afval: false,
        audio: false,
    };
}

export function syncSchermen(
    ruimte: AanvraagRuimte,
    aantal: number
): AanvraagRuimte {
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
    ruimtes: AanvraagRuimte[] | unknown
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
