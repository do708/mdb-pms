import { archiveSlug } from "@/lib/archive/formatArchiveLocationName";
import { supabaseStoragePathFromUrl } from "@/lib/documents/documentenboxStorage";
import { supabase } from "@/lib/supabase/admin";
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

export function userDocumentNasFolder(userId: string): string {
    const archive = synologyArchiveRoot();
    const parent = archive.replace(/\/[^/]+$/, "") || "/mdb-pms";

    return joinNasPath(parent, "gebruikers-documenten", userId);
}

function nasFilename(originalName: string): string {
    const cleaned =
        originalName.replace(/[\\/:*?"<>|]+/g, "_").trim() || "document";
    const lastDot = cleaned.lastIndexOf(".");
    const base = lastDot > 0 ? cleaned.slice(0, lastDot) : cleaned;
    const ext = lastDot > 0 ? cleaned.slice(lastDot) : "";

    return `${Date.now()}-${archiveSlug(base)}${ext.replace(/[^a-zA-Z0-9.]/g, "")}`;
}

export async function uploadUserDocumentToNas(
    userId: string,
    originalName: string,
    buffer: Buffer,
    contentType: string
): Promise<{ fileUrl: string; fileName: string }> {
    if (!isNasConfigured()) {
        throw new Error("NAS is niet ingesteld voor gebruikersdocumenten");
    }

    const fileName = nasFilename(originalName);
    const nasPath = await synologyUploadFile(
        userDocumentNasFolder(userId),
        fileName,
        buffer,
        contentType
    );

    return {
        fileUrl: nasFileUrl(nasPath),
        fileName: nasPath,
    };
}

export async function downloadUserDocumentFile(storedUrl: string): Promise<Buffer> {
    const nasPath = nasPathFromStored(storedUrl);

    if (nasPath) {
        return synologyDownloadFile(nasPath);
    }

    const supabasePath =
        supabaseStoragePathFromUrl(storedUrl)
        || (storedUrl.startsWith("user-docs/") ? storedUrl : null);

    if (!supabasePath) {
        throw new Error("Geen opslagpad voor dit document");
    }

    const download = await supabase.storage
        .from("workorder-files")
        .download(supabasePath);

    if (download.error || !download.data) {
        throw new Error(
            download.error?.message || "Bestand niet gevonden in opslag"
        );
    }

    return Buffer.from(await download.data.arrayBuffer());
}

export async function deleteUserDocumentFile(storedUrl: string): Promise<void> {
    const nasPath = nasPathFromStored(storedUrl);

    if (nasPath) {
        await synologyDeleteFile(nasPath).catch(() => {});
        return;
    }

    const supabasePath =
        supabaseStoragePathFromUrl(storedUrl)
        || (storedUrl.startsWith("user-docs/") ? storedUrl : null);

    if (!supabasePath) {
        return;
    }

    await supabase.storage
        .from("workorder-files")
        .remove([supabasePath])
        .catch(() => {});
}

/** Publieke download-URL via API (NAS of legacy Supabase). */
export function userDocumentFileApiPath(
    userId: string,
    docId: string
): string {
    return `/api/users/${userId}/documents/${docId}/file`;
}
