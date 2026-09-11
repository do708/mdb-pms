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
    /** Legacy: samengevoegd merk + type. Blijft in sync met merk/type. */
    merkType: string;
    merk: string;
    type: string;
    serienummer: string;
    mac: string;
    playerFotoUrl: string;
    /** Legacy: samengevoegd player-merk + type. Blijft in sync met playerMerk/playerType. */
    playerMerkType: string;
    playerMerk: string;
    playerType: string;
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

export function joinMerkType(merk: string, type: string): string {
    return [merk, type]
        .map((s) => (s || "").trim())
        .filter(Boolean)
        .join(" ");
}

/** Oude gecombineerde waarde (“Samsung QM55B”) splitsen in merk + type. */
export function splitMerkType(combined: string): { merk: string; type: string } {
    const t = (combined || "").trim();
    if (!t) {
        return { merk: "", type: "" };
    }
    const space = t.indexOf(" ");
    if (space <= 0) {
        return { merk: t, type: "" };
    }
    return {
        merk: t.slice(0, space),
        type: t.slice(space + 1).trim(),
    };
}

/** Vul merk/type uit legacy merkType (en player-equivalent). */
export function hydrateSchermHardware(
    s: InstallatieScherm
): InstallatieScherm {
    const merk = (s.merk || "").trim();
    const type = (s.type || "").trim();
    const scherm =
        !merk && !type
            ? splitMerkType(s.merkType || "")
            : { merk, type };

    const playerMerk = (s.playerMerk || "").trim();
    const playerType = (s.playerType || "").trim();
    const player =
        !playerMerk && !playerType
            ? splitMerkType(s.playerMerkType || "")
            : { merk: playerMerk, type: playerType };

    return {
        ...s,
        merk: scherm.merk,
        type: scherm.type,
        merkType: joinMerkType(scherm.merk, scherm.type),
        playerMerk: player.merk,
        playerType: player.type,
        playerMerkType: joinMerkType(player.merk, player.type),
        mac: normalizeMac(s.mac || ""),
        playerMac: normalizeMac(s.playerMac || ""),
    };
}

/** Regel voor werkbon/PDF: formaat + schermgegevens + optionele aansturing. */
export function samenvattingSchermHardware(s: InstallatieScherm): string {
    const formaat =
        s.formaat === "Anders"
            ? (s.formaatAnders || "Anders")
            : s.formaat;
    const merkType =
        joinMerkType(s.merk || "", s.type || "") || s.merkType || "";
    const player =
        joinMerkType(s.playerMerk || "", s.playerType || "")
        || s.playerMerkType
        || "";

    const scherm = [
        s.label,
        formaat,
        merkType,
        s.serienummer ? `SN ${s.serienummer}` : "",
        s.mac ? `MAC ${s.mac}` : "",
    ].filter(Boolean).join(" · ");

    const aansturing = [
        s.aansturing === "Anders"
            ? (s.aansturingAnders || "Anders")
            : s.aansturing,
        player,
        s.playerSerienummer ? `SN ${s.playerSerienummer}` : "",
        s.playerMac ? `MAC ${s.playerMac}` : "",
    ].filter(Boolean).join(" · ");

    return aansturing ? `${scherm} | Aansturing: ${aansturing}` : scherm;
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
        || (s.merk || "").trim()
        || (s.type || "").trim()
        || (s.serienummer || "").trim()
        || (s.mac || "").trim()
        || (s.playerMerkType || "").trim()
        || (s.playerMerk || "").trim()
        || (s.playerType || "").trim()
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
        merkType: joinMerkType(s.merk || "", s.type || "") || s.merkType,
        merk: s.merk || "",
        type: s.type || "",
        serienummer: s.serienummer,
        mac: normalizeMac(s.mac),
        playerMerkType:
            joinMerkType(s.playerMerk || "", s.playerType || "")
            || s.playerMerkType,
        playerMerk: s.playerMerk || "",
        playerType: s.playerType || "",
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
        merk: "",
        type: "",
        serienummer: "",
        mac: "",
        playerFotoUrl: "",
        playerMerkType: "",
        playerMerk: "",
        playerType: "",
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
