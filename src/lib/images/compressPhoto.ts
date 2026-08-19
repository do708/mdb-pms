/** Max. lange zijde in px — scherp genoeg voor PDF/rapportage, veel kleiner dan camerorigineel. */
const MAX_EDGE_PX = 2048;

/** JPEG-kwaliteit: goede balans tussen bestandsgrootte en detail. */
const JPEG_QUALITY = 85;

export interface CompressedPhoto {
    buffer: Buffer;
    contentType: string;
    /** Extensie met punt, bv. `.jpg` */
    extension: string;
    compressed: boolean;
}

function extensionFromMime(mimeType: string): string {
    if (mimeType === "image/jpeg") {
        return ".jpg";
    }

    if (mimeType === "image/png") {
        return ".png";
    }

    if (mimeType === "image/webp") {
        return ".webp";
    }

    return ".jpg";
}

function asOriginal(
    input: Buffer,
    mimeType: string
): CompressedPhoto {
    return {
        buffer: input,
        contentType: mimeType || "image/jpeg",
        extension: extensionFromMime(mimeType),
        compressed: false,
    };
}

/**
 * Comprimeert foto's server-side vóór opslag (Supabase/NAS).
 * Als sharp niet beschikbaar is (Vercel/native), blijft het origineel.
 */
export async function compressPhoto(
    input: Buffer,
    mimeType: string
): Promise<CompressedPhoto> {
    const type = (mimeType || "").toLowerCase();

    if (!type.startsWith("image/") || type === "image/gif") {
        return asOriginal(input, mimeType);
    }

    try {
        const sharpMod = await import("sharp");
        const sharp = sharpMod.default;
        const image = sharp(input, { failOn: "none" }).rotate();
        const meta = await image.metadata();

        const resize = {
            width: MAX_EDGE_PX,
            height: MAX_EDGE_PX,
            fit: "inside" as const,
            withoutEnlargement: true,
        };

        if (type === "image/png" && meta.hasAlpha) {
            const buffer = await image
                .resize(resize)
                .png({ compressionLevel: 9, palette: true })
                .toBuffer();

            return {
                buffer,
                contentType: "image/png",
                extension: ".png",
                compressed: true,
            };
        }

        const buffer = await image
            .resize(resize)
            .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
            .toBuffer();

        return {
            buffer,
            contentType: "image/jpeg",
            extension: ".jpg",
            compressed: true,
        };
    } catch (error) {
        console.warn("Foto-compressie overgeslagen, origineel behouden:", error);
        return asOriginal(input, mimeType);
    }
}

/** Vervang extensie wanneer compressie het formaat wijzigt (bv. HEIC → JPG). */
export function photoStorageName(originalName: string, extension: string): string {
    const base =
        (originalName || "foto")
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-zA-Z0-9._-]+/g, "_")
        || "foto";

    const ext = extension || ".jpg";

    return `${base}${ext.startsWith(".") ? ext : `.${ext}`}`;
}
