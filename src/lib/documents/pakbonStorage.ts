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

export function pakbonNasFolder(workorderNumber: string): string {
    const archive = synologyArchiveRoot();
    const parent = archive.replace(/\/[^/]+$/, "") || "/mdb-pms";

    return joinNasPath(parent, "pakbonnen", archiveSlug(workorderNumber));
}

function nasFilename(originalName: string): string {
    const cleaned =
        originalName.replace(/[\\/:*?"<>|]+/g, "_").trim() || "pakbon";
    const lastDot = cleaned.lastIndexOf(".");
    const base = lastDot > 0 ? cleaned.slice(0, lastDot) : cleaned;
    const ext = lastDot > 0 ? cleaned.slice(lastDot) : "";

    return `${Date.now()}-${archiveSlug(base)}${ext.replace(/[^a-zA-Z0-9.]/g, "")}`;
}

export async function uploadPakbonToNas(
    workorderNumber: string,
    originalName: string,
    buffer: Buffer,
    contentType: string
): Promise<string> {
    if (!isNasConfigured()) {
        throw new Error("NAS is niet ingesteld voor pakbonnen");
    }

    const nasPath = await synologyUploadFile(
        pakbonNasFolder(workorderNumber),
        nasFilename(originalName),
        buffer,
        contentType
    );

    return nasFileUrl(nasPath);
}

export async function downloadPakbonFromNas(storedUrl: string): Promise<Buffer> {
    const nasPath = nasPathFromStored(storedUrl);

    if (!nasPath) {
        throw new Error("Geen NAS-pad voor deze pakbon");
    }

    return synologyDownloadFile(nasPath);
}

export async function deletePakbonFromNas(storedUrl: string): Promise<void> {
    const nasPath = nasPathFromStored(storedUrl);

    if (!nasPath) {
        return;
    }

    await synologyDeleteFile(nasPath).catch(() => {});
}
