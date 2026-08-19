import { readFileSync } from "node:fs";
import { join } from "node:path";

import { rgb } from "pdf-lib";

import { MDB_LOGO_PNG_BASE64 } from "@/lib/pdf/mdbLogoBase64";

/** MDB-huisstijl (Excel-export / werkbon-PDF). */
export const MDB_BLUE = rgb(0, 102 / 255, 1);
export const MDB_YELLOW = rgb(1, 204 / 255, 0);
export const MDB_PINK = rgb(214 / 255, 0, 126 / 255);
export const MDB_NAVY = rgb(10 / 255, 37 / 255, 64 / 255);
export const MDB_SECTION_BG = rgb(244 / 255, 247 / 255, 251 / 255);

export function loadMdbLogoPng(): Buffer {
    const candidates = [
        join(process.cwd(), "public", "images", "MDB-Logo.png"),
        join(process.cwd(), "images", "MDB-Logo.png"),
    ];

    for (const path of candidates) {
        try {
            return readFileSync(path);
        } catch {
            /* volgende pad */
        }
    }

    return Buffer.from(MDB_LOGO_PNG_BASE64, "base64");
}

export function mdbLogoDataUrl(): string {
    return `data:image/png;base64,${loadMdbLogoPng().toString("base64")}`;
}
