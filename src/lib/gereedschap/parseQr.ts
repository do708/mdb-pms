/** Herkent MDB-assetcodes uit QR-tekst of geplakte URL's. */
const TOOL_CODE_RE = /\b(MDB-[GLTEM]-\d{5})\b/i;

/**
 * Haalt een toolcode uit QR-payload, handmatige invoer of `/asset/…`-URL.
 * Geeft altijd uppercase terug, of null als er geen code in zit.
 */
export function parseToolQrPayload(raw: string): string | null {
    const text = String(raw ?? "").trim();
    if (!text) return null;

    // Volledige of relatieve status-URL
    const assetIdx = text.toLowerCase().indexOf("/asset/");
    if (assetIdx >= 0) {
        const after = text.slice(assetIdx + "/asset/".length);
        const segment = after.split(/[/?#\s]/)[0] || "";
        const fromUrl = segment.match(TOOL_CODE_RE);
        if (fromUrl) return fromUrl[1].toUpperCase();
        if (segment) return segment.toUpperCase();
    }

    const match = text.match(TOOL_CODE_RE);
    if (match) return match[1].toUpperCase();

    // Platte code zonder prefix-noise
    const cleaned = text.replace(/\s+/g, "").toUpperCase();
    if (/^MDB-[GLTEM]-\d{5}$/.test(cleaned)) return cleaned;

    return null;
}
