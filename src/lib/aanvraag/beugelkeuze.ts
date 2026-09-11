/**
 * Beugelkeuze o.b.v. Beugelkeuze_database.xlsx (Vogel’s Pro-AV).
 * Combinatie: inch × oriëntatie × montage → bestellijst.
 */

import data from "./beugelkeuzeData.json";

/** Minimale schermvelden voor een databasematch (geen import-cyclus). */
export type BeugelKeuzeScherm = {
    formaat: string;
    formaatAnders?: string;
    beugel: string;
    bevestigingDetail?: string;
    bevestigingAnders?: string;
    plafondHoogte?: string;
    orientatie?: string;
};

export type BeugelArtikelRegel = {
    type: string;
    aantal: number;
    onderdeel: string;
    artikelnummer: string;
    eenheid: string;
};

type CombinatieJson = {
    status: string;
    artikelen: [string, number][];
};

const COMBINATIES = data.combinaties as Record<string, CombinatieJson>;
const ARTIKELEN = data.artikelen as Record<
    string,
    { artikelnummer: string; onderdeel: string; eenheid: string }
>;
const BEKENDE_INCHES = data.inches as number[];

function soortBevestiging(beugel?: string | null): string {
    if (beugel === "Specials") return "Special";
    return beugel || "";
}

function inchVanScherm(item: BeugelKeuzeScherm): number {
    const raw =
        item.formaat === "Anders" ? item.formaatAnders : item.formaat;
    const match = String(raw || "").match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

/** UI-detail / categorie → montage-naam in de database. */
export function montageVanScherm(item: BeugelKeuzeScherm): string {
    const soort = soortBevestiging(item.beugel);
    const detail = (item.bevestigingDetail || "").trim();
    const anders = (item.bevestigingAnders || "").trim();
    const lower = `${detail} ${anders}`.toLowerCase();

    if (soort === "Muurbeugel") {
        if (lower.includes("kantel")) return "Muur kantelbaar";
        if (lower.includes("draai") || lower.includes("zwenk")) {
            return "Muur draaibaar";
        }
        if (lower.includes("vast") || detail) return "Muur vlak";
        return "";
    }

    if (soort === "Plafondbeugel") {
        const cm = plafondHoogteCm(item.plafondHoogte);
        if (!cm) return "";
        const kantel =
            lower.includes("kantel") ||
            detail === "Vaste plafondbeugel kantelbare scherm";
        return `Plafond ${cm} cm ${kantel ? "kantelbaar" : "vast"}`;
    }

    if (soort === "Vloerstandaard") {
        if (lower.includes("trolley") || lower.includes("mobiel")) {
            return "Trolley";
        }
        if (lower.includes("plafond")) return "Vloer-plafond";
        if (lower.includes("schroef") || lower.includes("vastgeschroefd")) {
            return "Vloer vastgeschroefd";
        }
        if (detail) return "Vloer vrijstaand";
        return "";
    }

    if (soort === "Special") {
        if (lower.includes("kolom")) return "Kolombeugel";
        if (
            lower.includes("roter") ||
            lower.includes("roteer") ||
            lower.includes("rotat")
        ) {
            return "Roterende wandbeugel";
        }
        return "";
    }

    return "";
}

function plafondHoogteCm(hoogte?: string): number | 0 {
    const match = String(hoogte || "").match(/(\d+)/);
    if (!match) return 0;
    const n = parseInt(match[1], 10);
    if (n === 80 || n === 150 || n === 300) return n;
    return 0;
}

function dbOrientatie(ori: string): "Landscape" | "Portrait" {
    const lower = (ori || "").toLowerCase();
    if (
        lower.includes("portrait") ||
        lower === "staand" ||
        lower === "verticaal"
    ) {
        return "Portrait";
    }
    return "Landscape";
}

/** Exact inch als die in de tabel staat, anders dichtstbijzijnde. */
export function databaseInch(inch: number): number {
    if (!inch || inch < 1) return 0;
    if (BEKENDE_INCHES.includes(inch)) return inch;
    return BEKENDE_INCHES.reduce((best, n) =>
        Math.abs(n - inch) < Math.abs(best - inch) ? n : best
    );
}

export function beugelCombinatieSleutel(
    item: BeugelKeuzeScherm
): string {
    const inch = databaseInch(inchVanScherm(item));
    const montage = montageVanScherm(item);
    if (!inch || !montage) return "";
    return `${inch}|${dbOrientatie(item.orientatie || "")}|${montage}`;
}

export function zoekBeugelCombinatie(item: BeugelKeuzeScherm): {
    sleutel: string;
    status: string;
    artikelen: BeugelArtikelRegel[];
} | null {
    const sleutel = beugelCombinatieSleutel(item);
    if (!sleutel) return null;
    const rec = COMBINATIES[sleutel];
    if (!rec) return null;
    return {
        sleutel,
        status: rec.status,
        artikelen: rec.artikelen.map(([type, aantal]) => {
            const meta = ARTIKELEN[type];
            return {
                type,
                aantal,
                onderdeel: meta?.onderdeel || type,
                artikelnummer: meta?.artikelnummer || "",
                eenheid: meta?.eenheid || "stuk",
            };
        }),
    };
}

export function artikelLabel(regel: BeugelArtikelRegel): string {
    if (regel.onderdeel && regel.onderdeel !== regel.type) {
        return `${regel.type} — ${regel.onderdeel}`;
    }
    return regel.type;
}

/**
 * Compacte weergave per scherm (één artikel, of de complete set).
 * Leeg tot formaat + bevestiging een databasematch geven.
 */
export function mdbBeugelTypeWeergave(item: BeugelKeuzeScherm): string {
    const gevonden = zoekBeugelCombinatie(item);
    if (!gevonden) {
        return legacyBeugelLabel(item);
    }
    if (gevonden.artikelen.length === 0) {
        return legacyBeugelLabel(item);
    }
    if (gevonden.artikelen.length === 1) {
        const a = gevonden.artikelen[0];
        const naam = artikelLabel(a);
        return a.aantal > 1 ? `${a.aantal}× ${naam}` : naam;
    }
    return gevonden.artikelen
        .map((a) => `${a.aantal}× ${a.type}`)
        .join(" + ");
}

/** Aantallen per artikel over alle schermen (bestellijst). */
export function telBenodigdeBeugels(
    items: BeugelKeuzeScherm[]
): { label: string; aantal: number }[] {
    const counts = new Map<string, number>();

    for (const item of items) {
        const gevonden = zoekBeugelCombinatie(item);
        if (gevonden && gevonden.artikelen.length > 0) {
            for (const regel of gevonden.artikelen) {
                const label = artikelLabel(regel);
                counts.set(
                    label,
                    (counts.get(label) || 0) + regel.aantal
                );
            }
            continue;
        }

        const fallback = legacyBeugelLabel(item);
        if (!fallback) continue;
        counts.set(fallback, (counts.get(fallback) || 0) + 1);
    }

    return [...counts.entries()].map(([label, aantal]) => ({
        label,
        aantal,
    }));
}

/** Fallback als de combinatie ontbreekt of geen bestellijst heeft. */
function legacyBeugelLabel(item: BeugelKeuzeScherm): string {
    const soort = soortBevestiging(item.beugel);
    const detail =
        item.bevestigingDetail === "Anders"
            ? item.bevestigingAnders?.trim() || "Anders"
            : item.bevestigingDetail || "";
    const lower = detail.toLowerCase();

    if (!soort && !detail) return "";

    if (soort === "Plafondbeugel") {
        const naam = detail || "Plafondsteun Fixed";
        const hoogte = item.plafondHoogte?.trim();
        return [naam, hoogte].filter(Boolean).join(" · ");
    }
    if (soort === "Vloerstandaard") {
        return detail || "Vloerstandaard";
    }
    if (soort === "Special") {
        return detail || "Special";
    }
    if (lower.includes("kantel")) return "Wandsteun kantelbaar";
    if (lower.includes("draai") || lower.includes("zwenk")) {
        return "Draaibare / Zwenkbeugel";
    }
    if (lower.includes("vast") || soort === "Muurbeugel") {
        return "Wandsteun vast";
    }
    return detail || soort;
}
