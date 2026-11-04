import { archiveSlug } from "@/lib/archive/formatArchiveLocationName";
import {
    isNasConfigured,
    joinNasPath,
    nasFileUrl,
    nasPathFromStored,
    synologyArchiveRoot,
} from "@/lib/nas/synologyConfig";
import {
    synologyDeleteFile,
    synologyDownloadFile,
    synologyUploadFile,
} from "@/lib/nas/synologyClient";

export function documentenboxNasFolder(): string {
    const archive = synologyArchiveRoot();
    const parent = archive.replace(/\/[^/]+$/, "") || "/mdb-pms";

    return joinNasPath(parent, "documenten");
}

export function nasFilenameForDocument(originalName: string): string {
    const cleaned = originalName.replace(/[\\/:*?"<>|]+/g, "_").trim() || "bestand";
    const lastDot = cleaned.lastIndexOf(".");
    const base = lastDot > 0 ? cleaned.slice(0, lastDot) : cleaned;
    const ext = lastDot > 0 ? cleaned.slice(lastDot) : "";

    return `${Date.now()}-${archiveSlug(base)}${ext.replace(/[^a-zA-Z0-9.]/g, "")}`;
}

export async function uploadDocumentenboxToNas(
    originalName: string,
    buffer: Buffer,
    contentType: string
): Promise<string> {
    if (!isNasConfigured()) {
        throw new Error("NAS is niet ingesteld voor de documentenbox");
    }

    const nasPath = await synologyUploadFile(
        documentenboxNasFolder(),
        nasFilenameForDocument(originalName),
        buffer,
        contentType
    );

    return nasFileUrl(nasPath);
}

export async function downloadDocumentenboxFromNas(
    storedUrl: string
): Promise<Buffer> {
    const nasPath = nasPathFromStored(storedUrl);

    if (!nasPath) {
        throw new Error("Geen NAS-pad voor dit document");
    }

    return synologyDownloadFile(nasPath);
}

export async function deleteDocumentenboxFromNas(
    storedUrl: string
): Promise<void> {
    const nasPath = nasPathFromStored(storedUrl);

    if (!nasPath) {
        return;
    }

    await synologyDeleteFile(nasPath).catch(() => {});
}

export function supabaseStoragePathFromUrl(url: string): string | null {
    const marker = "/workorder-files/";
    const index = url.indexOf(marker);

    if (index === -1) {
        return null;
    }

    try {
        return decodeURIComponent(
            url.slice(index + marker.length).split("?")[0].split("#")[0]
        );
    } catch {
        return url.slice(index + marker.length).split("?")[0];
    }
}
