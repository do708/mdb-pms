/**
 * Prefill klaarzet-materiaalvelden vanuit aanvraag-specificaties.
 */

import { isPlayerAansturing } from "@/lib/aanvraag/installatieTypes";

export type KlaarzetPrefill = {
    schermenAantal?: string;
    playersAantal?: string;
    beugelsAantal?: string;
    kioskAantal?: string;
    versterkersAantal?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function formaatVanScherm(s: Record<string, unknown>): string {
    if (str(s.formaat) === "Anders") {
        return str(s.formaatAnders) || "Anders";
    }
    return str(s.formaat);
}

function groepeerTeksten(items: string[]): string {
    const map = new Map<string, number>();
    for (const raw of items) {
        const key = raw.trim();
        if (!key) continue;
        map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()]
        .map(([tekst, n]) => (n > 1 ? `${n}x ${tekst}` : `1x ${tekst}`))
        .join(", ");
}

/**
 * Lees snapshot/envelope of ruwe specificaties → tekst voor Materiaal-rijen.
 */
export function klaarzetVanAanvraagSpecificaties(
    snapshotOrSpecs: unknown
): KlaarzetPrefill {
    const envelope = asRecord(snapshotOrSpecs);
    const specs =
        asRecord(envelope?.specificaties) || envelope || {};

    const out: KlaarzetPrefill = {};

    const schermen = asRecord(specs.schermen);
    if (schermen?.aan && Array.isArray(schermen.items)) {
        const formaten = schermen.items
            .map((item) => {
                const r = asRecord(item);
                return r ? formaatVanScherm(r) : "";
            })
            .filter(Boolean);
        const tekst = groepeerTeksten(formaten);
        if (tekst) {
            out.schermenAantal = tekst;
            // Alleen aparte players bij Player (niet bij Tizen/webOS/Android).
            // Legacy "DMV player" telt mee.
            const playerCount = schermen.items.filter((item) => {
                const r = asRecord(item);
                return r ? isPlayerAansturing(str(r.aansturing)) : false;
            }).length;
            if (playerCount > 0) {
                out.playersAantal = String(playerCount);
            }
        }

        const beugels = schermen.items
            .map((item) => {
                const r = asRecord(item);
                if (!r) return "";
                return str(r.bevestigingDetail) || str(r.beugel);
            })
            .filter(Boolean);
        const beugelTekst = groepeerTeksten(beugels);
        if (beugelTekst) out.beugelsAantal = beugelTekst;
    }

    const kiosk = asRecord(specs.kiosk);
    if (kiosk?.aan && Array.isArray(kiosk.items) && kiosk.items.length > 0) {
        const n = kiosk.items.length;
        out.kioskAantal = n === 1 ? "1x kiosk" : `${n}x kiosk`;
    }

    const audio = asRecord(specs.audio);
    if (audio?.aan) {
        const velden = asRecord(audio.velden) || {};
        const delen: string[] = [];
        const speakersAantal = str(velden.speakersAantal);
        const speakersType = str(velden.speakersType);
        if (speakersAantal || speakersType) {
            delen.push(
                [speakersAantal ? `${speakersAantal}x` : "", speakersType || "speakers"]
                    .filter(Boolean)
                    .join(" ")
                    .trim()
            );
        }
        const versterker = str(velden.versterker);
        if (versterker) delen.push(versterker);
        if (delen.length > 0) {
            out.versterkersAantal = delen.join(" + ");
        } else {
            out.versterkersAantal = "Audio";
        }
    }

    // eValue8-producten: geen vaste mapping naar schermen/players; laat leeg.

    return out;
}

/** Vul alleen lege materiaalvelden; bestaande invoer blijft staan. */
export function mergeKlaarzetPrefill<T extends Record<string, unknown>>(
    current: T,
    prefill: KlaarzetPrefill
): T {
    const next = { ...current };
    for (const [key, value] of Object.entries(prefill)) {
        if (!value || !String(value).trim()) continue;
        const cur = next[key as keyof T];
        if (typeof cur === "string" && cur.trim()) continue;
        if (cur != null && cur !== "" && typeof cur !== "string") continue;
        (next as Record<string, unknown>)[key] = value;
    }
    return next;
}
