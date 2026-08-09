/**
 * Korte samenvatting voor het veld "Werkzaamheden (voor de klant)" /
 * afspraakmail. Geen beugel/type/stroom-details — die staan in de
 * specificatie-weergave voor office/uitvoering.
 *
 * Voorbeeld: `2× 50" schermen in de kantine, 1× kiosk in de entree`
 */

type SchermItem = {
    formaat?: string;
    formaatAnders?: string;
    orientatie?: string;
    locatie?: string;
};

type KioskItem = {
    locatie?: string;
};

function formaatLabel(s: SchermItem): string {
    if (s.formaat === "Anders") {
        return (s.formaatAnders || "Anders").trim();
    }
    return (s.formaat || "").trim();
}

function locatieZin(locatie: string | undefined): string {
    const loc = (locatie || "").trim();
    if (!loc) return "";
    const lower = loc.toLowerCase();
    if (
        lower.startsWith("de ") ||
        lower.startsWith("het ") ||
        lower.startsWith("een ")
    ) {
        return `in ${loc}`;
    }
    return `in de ${loc}`;
}

function groepeerSchermen(items: SchermItem[]): string[] {
    const map = new Map<
        string,
        { count: number; formaat: string; locatie: string }
    >();

    for (const s of items) {
        const formaat = formaatLabel(s);
        const locatie = (s.locatie || "").trim();
        const key = `${formaat.toLowerCase()}|${locatie.toLowerCase()}`;
        const bestaand = map.get(key);
        if (bestaand) {
            bestaand.count += 1;
        } else {
            map.set(key, {
                count: 1,
                formaat,
                locatie,
            });
        }
    }

    return [...map.values()].map((g) => {
        const woord = g.count === 1 ? "scherm" : "schermen";
        const formaatDeel = g.formaat ? `${g.formaat} ` : "";
        const loc = locatieZin(g.locatie);
        return [`${g.count}× ${formaatDeel}${woord}`, loc]
            .filter(Boolean)
            .join(" ");
    });
}

function groepeerKiosken(items: KioskItem[]): string[] {
    const map = new Map<string, { count: number; locatie: string }>();

    for (const k of items) {
        const locatie = (k.locatie || "").trim();
        const key = locatie.toLowerCase() || "__";
        const bestaand = map.get(key);
        if (bestaand) {
            bestaand.count += 1;
        } else {
            map.set(key, { count: 1, locatie });
        }
    }

    return [...map.values()].map((g) => {
        const woord = g.count === 1 ? "kiosk" : "kiosken";
        const loc = locatieZin(g.locatie);
        return [`${g.count}× ${woord}`, loc].filter(Boolean).join(" ");
    });
}

function audioSamenvatting(velden: Record<string, string>): string {
    const aantal = (velden.speakersAantal || "").trim();
    const type = (velden.speakersType || "").trim();
    if (aantal && type) return `${aantal}× ${type} speakers`;
    if (aantal) return `${aantal}× speakers`;
    if (type) return `Audio (${type})`;
    return "Audio";
}

function videowallSamenvatting(velden: Record<string, string>): string {
    const formaat = (velden.formaat || velden.formaatAnders || "").trim();
    const loc = locatieZin(velden.locatie || velden.opmerking);
    const basis = formaat ? `Videowall ${formaat}` : "Videowall";
    return [basis, loc].filter(Boolean).join(" ");
}

function evalue8Samenvatting(value: unknown): string[] {
    if (!value || typeof value !== "object") return [];
    const regels: string[] = [];
    for (const [naam, item] of Object.entries(
        value as Record<string, { aan?: boolean; aantal?: string }>
    )) {
        if (!item?.aan) continue;
        const n = Number.parseInt(String(item.aantal || "1"), 10);
        const count = Number.isFinite(n) && n > 0 ? n : 1;
        regels.push(`${count}× ${naam}`);
    }
    return regels;
}

/**
 * Bouwt de klantgerichte werkzaamhedentekst uit aanvraag-specificaties.
 */
export function bouwKlantWerkzaamheden(
    specs: Record<string, unknown>,
    typeAanvraag: string
): string {
    if (typeAanvraag === "storing") {
        const storing =
            specs.storing && typeof specs.storing === "object"
                ? (specs.storing as { omschrijving?: string })
                : {};
        const o = (storing.omschrijving || "").trim();
        return o ? `Storing: ${o}` : "Storing";
    }

    if (typeAanvraag === "intake") {
        const wens =
            (typeof specs.intakeWens === "string" && specs.intakeWens.trim())
            || (
                specs.intake
                && typeof specs.intake === "object"
                && typeof (specs.intake as { wens?: string }).wens === "string"
                    ? String((specs.intake as { wens?: string }).wens).trim()
                    : ""
            );
        return wens ? `Intake: ${wens}` : "Intake";
    }

    if (typeAanvraag === "uren") {
        const dagen = String(specs.geschatUren || "").trim();
        const monteurs = String(specs.aantalMonteurs || "").trim();
        if (dagen || monteurs) {
            const delen = [
                dagen ? `${dagen} dag(en)` : "",
                monteurs ? `${monteurs} monteur(s)` : "",
            ].filter(Boolean);
            return `Uren (${delen.join(", ")})`;
        }
        return "Uren";
    }

    const delen: string[] = [];

    const schermen =
        specs.schermen && typeof specs.schermen === "object"
            ? (specs.schermen as {
                  aan?: boolean;
                  items?: SchermItem[];
              })
            : null;
    if (schermen?.aan && Array.isArray(schermen.items) && schermen.items.length > 0) {
        delen.push(...groepeerSchermen(schermen.items));
    }

    const kiosk =
        specs.kiosk && typeof specs.kiosk === "object"
            ? (specs.kiosk as {
                  aan?: boolean;
                  items?: KioskItem[];
              })
            : null;
    if (kiosk?.aan && Array.isArray(kiosk.items) && kiosk.items.length > 0) {
        delen.push(...groepeerKiosken(kiosk.items));
    }

    const videowall =
        specs.videowall && typeof specs.videowall === "object"
            ? (specs.videowall as { aan?: boolean; velden?: Record<string, string> })
            : null;
    if (videowall?.aan) {
        delen.push(videowallSamenvatting(videowall.velden || {}));
    }

    const audio =
        specs.audio && typeof specs.audio === "object"
            ? (specs.audio as { aan?: boolean; velden?: Record<string, string> })
            : null;
    if (audio?.aan) {
        delen.push(audioSamenvatting(audio.velden || {}));
    }

    delen.push(...evalue8Samenvatting(specs.evalue8Producten));

    return delen.join(", ");
}
