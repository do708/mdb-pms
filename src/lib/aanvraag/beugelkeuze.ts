/**
 * Beugelkeuze o.b.v. Beugelkeuze_database.xlsx (Vogel’s Pro-AV).
 * Combinatie: inch × oriëntatie × montage → bestellijst.
 */

import data from "./beugelkeuzeData.json";

/** Minimale schermvelden voor een databasematch (geen import-cyclus). */
export type BeugelKeuzeScherm = {
    id?: string;
    formaat: string;
    formaatAnders?: string;
    beugel: string;
    bevestigingDetail?: string;
    bevestigingAnders?: string;
    plafondHoogte?: string;
    orientatie?: string;
    naastSchermId?: string;
    monterenKoppeling?: "" | "naast" | "b2b";
};

export type BeugelArtikelRegel = {
    type: string;
    aantal: number;
    onderdeel: string;
    artikelnummer: string;
    eenheid: string;
};

type BeugelArtikelTuple = [type: string, aantal: number];

type CombinatieJson = {
    status: string;
    artikelen: BeugelArtikelTuple[];
};

// JSON-import verliest tuple-types ((string | number)[][] i.p.v. [string, number][]).
const COMBINATIES = data.combinaties as unknown as Record<
    string,
    CombinatieJson
>;
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

const BEVESTIGING_DETAIL_WEERGAVE: Record<string, string> = {
    "Vaste muurbeugel": "Muurbeugel",
    "Vaste plafondbeugel": "Plafondbeugel",
    "Vaste plafondbeugel kantelbare scherm": "Plafondbeugel kantelbare scherm",
    "Vaste vloerstandaard": "Vloerstandaard",
    "Vaste plafondplaat": "Plafondplaat",
};

function onderdeelWeergave(naam: string): string {
    return BEVESTIGING_DETAIL_WEERGAVE[naam] || naam;
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
                onderdeel: onderdeelWeergave(meta?.onderdeel || type),
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

/** Eén artikelregel voor tabelcellen (aantal / code / naam). */
export type BeugelArtikelKolom = {
    aantal: number;
    artikel: string;
    naam: string;
};

function kolomVanRegel(a: BeugelArtikelRegel): BeugelArtikelKolom {
    return {
        aantal: a.aantal,
        artikel: a.type,
        naam: a.onderdeel && a.onderdeel !== a.type ? a.onderdeel : "",
    };
}

function kolomVanType(type: string, aantal: number): BeugelArtikelKolom | null {
    if (!type || aantal <= 0) return null;
    const meta = ARTIKELEN[type];
    const onderdeel = onderdeelWeergave(meta?.onderdeel || type);
    return {
        aantal,
        artikel: type,
        naam: onderdeel && onderdeel !== type ? onderdeel : "",
    };
}

function soloBeugelArtikelen(item: BeugelKeuzeScherm): BeugelArtikelKolom[] {
    const gevonden = zoekBeugelCombinatie(item);
    if (!gevonden || gevonden.artikelen.length === 0) {
        const fallback = legacyBeugelLabel(item);
        return fallback ? [{ aantal: 1, artikel: "", naam: fallback }] : [];
    }
    return gevonden.artikelen.map(kolomVanRegel);
}

function isPlafondbeugel(item: BeugelKeuzeScherm): boolean {
    return soortBevestiging(item.beugel) === "Plafondbeugel";
}

function isInterfaceprofiel(type: string): boolean {
    return type.startsWith("PFB ");
}

function isInterfacestrips(type: string): boolean {
    return type.startsWith("PFS ");
}

/**
 * PUC-plafondplaat-setup (Connect-it):
 * - b2b: plaat (PUC 1060) en buis gedeeld (1 set voor het paar; 75"+ mag
 *   de DB-aantallen heavy-duty van het grootste scherm houden). Elk scherm
 *   in het paar heeft eigen PFB + eigen PFS. PFA 9126 (profiel aan buis)
 *   blijft bij de gedeelde buis (1×), tenzij een solo-scherm van dat formaat
 *   extra kits heeft — die komen mee via de primaire BOM minus PFB/PFS.
 * - naast (2): elk scherm eigen 1060 + buis; 1× interfaceprofiel voor de
 *   som van de inches. DB: 32–65" → PFB 3405B, 75–98" → PFB 3407B.
 *   Som > 98" t/m ~130" (2×65"): PFB 3409B (langste bar in de catalogus;
 *   komt niet voor in single-screen combinaties).
 * - naast (3+): barren in ketens van max. ~130"; PUA 9503 als koppelstuk
 *   waar twee barren elkaar ontmoeten (Excel heeft geen PFB-koppelstrip).
 */
const MAX_PFB_3409_INCH = 130;

function schermSleutel(
    item: BeugelKeuzeScherm,
    alle: BeugelKeuzeScherm[]
): string {
    if (item.id) return item.id;
    const idx = alle.indexOf(item);
    return idx >= 0 ? `#${idx}` : "";
}

function plafondComponent(
    start: BeugelKeuzeScherm,
    alle: BeugelKeuzeScherm[]
): BeugelKeuzeScherm[] {
    const byId = new Map<string, BeugelKeuzeScherm>();
    for (const s of alle) {
        if (s.id) byId.set(s.id, s);
    }
    if (!start.id || !byId.has(start.id)) {
        return [start];
    }

    const buurIds = (s: BeugelKeuzeScherm): string[] => {
        const out: string[] = [];
        if (s.naastSchermId && byId.has(s.naastSchermId)) {
            out.push(s.naastSchermId);
        }
        for (const ander of alle) {
            if (ander.naastSchermId && ander.naastSchermId === s.id && ander.id) {
                out.push(ander.id);
            }
        }
        return out;
    };

    const seen = new Set<string>();
    const queue = [start.id];
    seen.add(start.id);
    while (queue.length) {
        const id = queue.shift()!;
        const s = byId.get(id);
        if (!s) continue;
        for (const nid of buurIds(s)) {
            if (!seen.has(nid)) {
                seen.add(nid);
                queue.push(nid);
            }
        }
    }

    const groep = alle.filter((s) => s.id && seen.has(s.id) && isPlafondbeugel(s));
    if (groep.length === 0) {
        return isPlafondbeugel(start) ? [start] : [];
    }
    return groep;
}

function groepIsB2b(groep: BeugelKeuzeScherm[]): boolean {
    const volgers = groep.filter((s) => s.naastSchermId);
    if (volgers.length === 0) return false;
    return volgers.every((s) => s.monterenKoppeling === "b2b");
}

function groepIsNaast(groep: BeugelKeuzeScherm[]): boolean {
    const volgers = groep.filter((s) => s.naastSchermId);
    if (volgers.length === 0) return false;
    if (groepIsB2b(groep)) return false;
    return volgers.some((s) => s.monterenKoppeling === "naast");
}

function pfbVoorGecombineerdeInch(
    inchSom: number,
    sjabloon: BeugelKeuzeScherm
): string {
    if (inchSom <= 0) return "PFB 3405B";
    if (inchSom > 98 && inchSom <= MAX_PFB_3409_INCH) {
        return "PFB 3409B";
    }
    const inch = databaseInch(Math.min(inchSom, 98));
    const lookup: BeugelKeuzeScherm = {
        ...sjabloon,
        formaat: `${inch}"`,
        formaatAnders: "",
    };
    const combo = zoekBeugelCombinatie(lookup);
    const pfb = combo?.artikelen.find((a) => isInterfaceprofiel(a.type));
    return pfb?.type || "PFB 3405B";
}

function verdeelNaastInBarGroepen(
    schermen: BeugelKeuzeScherm[]
): BeugelKeuzeScherm[][] {
    const groepen: BeugelKeuzeScherm[][] = [];
    let huidig: BeugelKeuzeScherm[] = [];
    let som = 0;
    for (const s of schermen) {
        const inch = inchVanScherm(s);
        if (huidig.length > 0 && som + inch > MAX_PFB_3409_INCH) {
            groepen.push(huidig);
            huidig = [s];
            som = inch;
        } else {
            huidig.push(s);
            som += inch;
        }
    }
    if (huidig.length > 0) groepen.push(huidig);
    return groepen;
}

function voegKolomToe(
    map: Map<string, BeugelArtikelKolom[]>,
    key: string,
    kolom: BeugelArtikelKolom | null
) {
    if (!kolom) return;
    const lijst = map.get(key) || [];
    const bestaand = lijst.find((r) => r.artikel && r.artikel === kolom.artikel);
    if (bestaand) {
        bestaand.aantal += kolom.aantal;
    } else {
        lijst.push({ ...kolom });
    }
    map.set(key, lijst);
}

function plafondArtikelenVoorGroep(
    groep: BeugelKeuzeScherm[],
    alle: BeugelKeuzeScherm[]
): Map<string, BeugelArtikelKolom[]> {
    const out = new Map<string, BeugelArtikelKolom[]>();
    const ordered = [...groep].sort(
        (a, b) => alle.indexOf(a) - alle.indexOf(b)
    );
    const firstKey = schermSleutel(ordered[0], alle);

    if (groepIsB2b(groep)) {
        const primair = ordered.reduce((best, s) =>
            inchVanScherm(s) > inchVanScherm(best) ? s : best
        );
        for (const kolom of soloBeugelArtikelen(primair)) {
            if (
                isInterfaceprofiel(kolom.artikel) ||
                isInterfacestrips(kolom.artikel)
            ) {
                continue;
            }
            voegKolomToe(out, firstKey, kolom);
        }
        for (const s of ordered) {
            const k = schermSleutel(s, alle);
            for (const kolom of soloBeugelArtikelen(s)) {
                if (
                    isInterfaceprofiel(kolom.artikel) ||
                    isInterfacestrips(kolom.artikel)
                ) {
                    voegKolomToe(out, k, kolom);
                }
            }
            if (!out.has(k)) out.set(k, []);
        }
        return out;
    }

    if (!groepIsNaast(groep)) {
        for (const s of ordered) {
            out.set(schermSleutel(s, alle), soloBeugelArtikelen(s));
        }
        return out;
    }

    for (const s of ordered) {
        const key = schermSleutel(s, alle);
        const combo = zoekBeugelCombinatie(s);
        if (!combo || combo.artikelen.length === 0) {
            out.set(key, soloBeugelArtikelen(s));
            continue;
        }
        for (const a of combo.artikelen) {
            if (isInterfaceprofiel(a.type)) continue;
            voegKolomToe(out, key, kolomVanRegel(a));
        }
    }

    const barGroepen = verdeelNaastInBarGroepen(ordered);
    barGroepen.forEach((bar, i) => {
        const som = bar.reduce((n, s) => n + inchVanScherm(s), 0);
        const pfb = pfbVoorGecombineerdeInch(som, bar[0]);
        const drager = schermSleutel(bar[0], alle);
        voegKolomToe(out, drager, kolomVanType(pfb, 1));
        if (i > 0) {
            voegKolomToe(out, drager, kolomVanType("PUA 9503", 1));
        }
    });

    return out;
}

/**
 * Per scherm de BOM. Met `alle` worden plafond + naast/b2b gedeelde
 * PUC-onderdelen niet dubbel geteld.
 */
export function schermBeugelArtikelen(
    item: BeugelKeuzeScherm,
    alle?: BeugelKeuzeScherm[]
): BeugelArtikelKolom[] {
    const lijst = alle && alle.length > 0 ? alle : [item];
    if (isPlafondbeugel(item) && lijst.length > 1) {
        const groep = plafondComponent(item, lijst);
        if (groep.length > 1) {
            const perScherm = plafondArtikelenVoorGroep(groep, lijst);
            const key = schermSleutel(item, lijst);
            return perScherm.get(key) || [];
        }
    }
    return soloBeugelArtikelen(item);
}

/**
 * Artikel achter het scherm in het type-overzicht:
 * `1× PFW 4510, Muurbeugel kantelbaar`.
 * Leeg tot formaat + bevestiging een match (of legacy-label) geven.
 */
export function schermBeugelArtikelWeergave(item: BeugelKeuzeScherm): string {
    const rijen = schermBeugelArtikelen(item);
    if (rijen.length === 0) return "";
    return rijen
        .map((a) => {
            const artikel = a.artikel
                ? `${a.aantal}× ${a.artikel}`
                : `${a.aantal}×`;
            return a.naam ? `${artikel}, ${a.naam}` : artikel;
        })
        .join(" + ");
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

export type BenodigdeBeugelRij = {
    label: string;
    aantal: number;
    artikel: string;
    naam: string;
};

/** Aantallen per artikel over alle schermen (bestellijst). */
export function telBenodigdeBeugels(
    items: BeugelKeuzeScherm[]
): BenodigdeBeugelRij[] {
    const counts = new Map<string, BenodigdeBeugelRij>();

    for (const item of items) {
        for (const rij of schermBeugelArtikelen(item, items)) {
            const label = rij.artikel
                ? rij.naam
                    ? `${rij.artikel} — ${rij.naam}`
                    : rij.artikel
                : rij.naam;
            if (!label) continue;
            const bestaand = counts.get(label);
            if (bestaand) {
                bestaand.aantal += rij.aantal;
            } else {
                counts.set(label, {
                    label,
                    aantal: rij.aantal,
                    artikel: rij.artikel,
                    naam: rij.naam,
                });
            }
        }
    }

    return [...counts.values()];
}

/** Fallback als de combinatie ontbreekt of geen bestellijst heeft. */
function legacyBeugelLabel(item: BeugelKeuzeScherm): string {
    const soort = soortBevestiging(item.beugel);
    const detail =
        item.bevestigingDetail === "Anders"
            ? item.bevestigingAnders?.trim() || "Anders"
            : BEVESTIGING_DETAIL_WEERGAVE[item.bevestigingDetail || ""]
                || item.bevestigingDetail
                || "";
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
