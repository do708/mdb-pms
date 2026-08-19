import JSZip from "jszip";

export function extensionFromPhotoUrl(
    url: string,
    contentType: string | null = null
): string {
    try {
        const path = new URL(url).pathname;
        const match = path.match(/\.([a-zA-Z0-9]{2,5})$/);
        if (match) {
            return match[1].toLowerCase();
        }
    } catch {
        // negeer ongeldige URL
    }

    if (contentType?.includes("png")) return "png";
    if (contentType?.includes("webp")) return "webp";
    if (contentType?.includes("gif")) return "gif";
    return "jpg";
}

/** Bestandsnaam in de ZIP: de naam die de monteur gaf, anders foto-N. */
export function photoZipBaseName(
    photo: { caption?: string | null; filename?: string | null },
    index: number
): string {
    const fromCaption = (photo.caption || "").trim();
    const raw = fromCaption || `foto-${index + 1}`;

    const cleaned = raw
        .replace(/[\\/:*?"<>|]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\.[a-zA-Z0-9]{2,5}$/, "")
        .trim()
        || `foto-${index + 1}`;

    return cleaned.slice(0, 80);
}

function uniqueEntryName(
    used: Set<string>,
    base: string,
    ext: string
): string {
    let name = `${base}.${ext}`;
    let n = 2;

    while (used.has(name.toLowerCase())) {
        name = `${base}-${n}.${ext}`;
        n += 1;
    }

    used.add(name.toLowerCase());
    return name;
}

export async function buildWorkorderPhotosZip(
    photos: Array<{
        id?: string;
        url: string;
        filename?: string | null;
        caption?: string | null;
    }>
): Promise<Buffer | null> {
    if (photos.length === 0) {
        return null;
    }

    const zip = new JSZip();
    const used = new Set<string>();
    let added = 0;

    for (let index = 0; index < photos.length; index++) {
        const photo = photos[index];

        try {
            const response = await fetch(photo.url);

            if (!response.ok) {
                console.error(
                    "PHOTO ZIP FETCH FAILED",
                    photo.id ?? photo.url,
                    response.status
                );
                continue;
            }

            const contentType = response.headers.get("content-type");
            const buffer = Buffer.from(await response.arrayBuffer());
            const ext = extensionFromPhotoUrl(photo.url, contentType);
            const base = photoZipBaseName(photo, index);

            zip.file(uniqueEntryName(used, base, ext), buffer);
            added += 1;
        } catch (error) {
            console.error("PHOTO ZIP FETCH ERROR", photo.id ?? photo.url, error);
        }
    }

    if (added === 0) {
        return null;
    }

    return zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
    });
}
