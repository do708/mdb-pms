/**
 * Meerdere videowalls per locatie (aanvraag JSON + werkbon formData).
 * Oude data: alleen `velden`; nieuwe data: `items` (+ `velden` = items[0]).
 */

import { aantalPanelenVanConfiguratie } from "@/lib/workorders/videowallPanelen";
import type { OpleverWerkzaamheid } from "@/lib/workorders/opleverModules";

export type VideowallVelden = Record<string, string>;

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

export function asVideowallVelden(value: unknown): VideowallVelden {
    const rec = asRecord(value);
    if (!rec) {
        return {};
    }
    return Object.fromEntries(
        Object.entries(rec).filter(([, v]) => typeof v === "string")
    ) as VideowallVelden;
}

export function emptyVideowallVelden(): VideowallVelden {
    return {};
}

export function videowallHeeftInhoud(velden: VideowallVelden): boolean {
    return Object.values(velden).some((v) => String(v || "").trim());
}

/** Aanvraag-blok `{ aan, velden, items }` → lijst (minimaal 1). */
export function videowallItemsVanBlok(blok: unknown): VideowallVelden[] {
    const rec = asRecord(blok);
    if (!rec) {
        return [emptyVideowallVelden()];
    }
    if (Array.isArray(rec.items) && rec.items.length > 0) {
        return rec.items.map((item) => asVideowallVelden(item));
    }
    return [asVideowallVelden(rec.velden)];
}

export function videowallItemsVanSpecs(specs: unknown): VideowallVelden[] {
    const rec = asRecord(specs);
    const blok = rec?.videowall ?? rec;
    const inner = asRecord(blok);
    if (inner && inner.aan === false) {
        return [];
    }
    if (!inner?.aan && !Array.isArray(inner?.items) && !inner?.velden) {
        return [];
    }
    return videowallItemsVanBlok(blok);
}

type InstallatieVideowallBron = {
    videowallItemsPerType?: Partial<
        Record<OpleverWerkzaamheid | string, VideowallVelden[]>
    >;
    videowallPerType?: Partial<
        Record<OpleverWerkzaamheid | string, VideowallVelden>
    >;
    videowallVelden?: VideowallVelden;
};

export function videowallItemsVoorType(
    i: InstallatieVideowallBron,
    type: string
): VideowallVelden[] {
    const fromItems = i.videowallItemsPerType?.[type];
    if (Array.isArray(fromItems) && fromItems.length > 0) {
        return fromItems.map((item) => asVideowallVelden(item));
    }
    const single = i.videowallPerType?.[type];
    if (single && videowallHeeftInhoud(single)) {
        return [asVideowallVelden(single)];
    }
    return [];
}

export function alleVideowallItems(
    i: InstallatieVideowallBron
): VideowallVelden[] {
    const collected: VideowallVelden[] = [];
    const perType = i.videowallItemsPerType || {};
    for (const items of Object.values(perType)) {
        if (Array.isArray(items) && items.length > 0) {
            collected.push(...items.map((item) => asVideowallVelden(item)));
        }
    }
    if (collected.length > 0) {
        return collected;
    }
    const singles = i.videowallPerType || {};
    for (const velden of Object.values(singles)) {
        if (velden && videowallHeeftInhoud(velden)) {
            collected.push(asVideowallVelden(velden));
        }
    }
    if (collected.length > 0) {
        return collected;
    }
    if (i.videowallVelden && videowallHeeftInhoud(i.videowallVelden)) {
        return [asVideowallVelden(i.videowallVelden)];
    }
    return [];
}

export function videowallLabel(velden: VideowallVelden, index: number): string {
    const type =
        velden.type === "LED"
            ? "LED"
            : velden.type === "LCD"
              ? "LCD"
              : "";
    const loc = (velden.locatie || velden.opmerking || "").trim();
    const basis = type
        ? `Videowall ${index + 1} (${type})`
        : `Videowall ${index + 1}`;
    return loc ? `${basis} — ${loc}` : basis;
}

export function videowallPaneelAantal(velden: VideowallVelden): number {
    if ((velden.type || "").trim() !== "LCD") {
        return 0;
    }
    return aantalPanelenVanConfiguratie(velden.configuratie || "");
}
