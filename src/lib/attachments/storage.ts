import { createClient } from "@supabase/supabase-js";

import {
    isNasArchiveEnabled,
    joinNasPath,
    nasPathFromStored,
} from "@/lib/nas/synologyConfig";
import {
    synologyDeleteFile,
    synologyDownloadFile,
    synologyListFiles,
} from "@/lib/nas/synologyClient";

const BUCKET = "workorder-files";

const URL_MARKERS = [
    "/object/public/workorder-files/",
    "/object/sign/workorder-files/",
    "/object/authenticated/workorder-files/",
    "/render/image/public/workorder-files/",
    "/workorder-files/",
];

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class AttachmentNotFoundError extends Error {
    constructor() {
        super("Bestand niet gevonden in de opslag");
        this.name = "AttachmentNotFoundError";
    }
}

export type AttachmentStorageRef = {
    filename: string | null;
    url: string;
    originalName?: string | null;
    workorderId?: string | null;
    projectId?: string | null;
    archiveNasPath?: string | null;
};

function decodePath(raw: string): string {
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}

function stripQueryAndHash(raw: string): string {
    return raw.split("?")[0].split("#")[0];
}

function pathFromStorageUrl(url: string): string | null {
    for (const marker of URL_MARKERS) {
        const index = url.indexOf(marker);

        if (index === -1) {
            continue;
        }

        const raw = stripQueryAndHash(url.slice(index + marker.length));

        if (raw) {
            return decodePath(raw);
        }
    }

    return null;
}

function normalizeStoragePath(raw: string | null | undefined): string | null {
    if (!raw) {
        return null;
    }

    const trimmed = stripQueryAndHash(raw.trim());

    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return pathFromStorageUrl(trimmed);
    }

    if (nasPathFromStored(trimmed)) {
        return null;
    }

    let path = decodePath(trimmed).replace(/^\/+/, "");

    if (path.startsWith(`${BUCKET}/`)) {
        path = path.slice(BUCKET.length + 1);
    }

    return path || null;
}

function basename(path: string): string {
    return path.split("/").filter(Boolean).pop() || path;
}

function sanitizedName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function pushUnique(list: string[], seen: Set<string>, value: string | null) {
    if (!value) {
        return;
    }

    if (seen.has(value)) {
        return;
    }

    seen.add(value);
    list.push(value);
}

export function candidateStoragePaths(attachment: AttachmentStorageRef): string[] {
    const seen = new Set<string>();
    const paths: string[] = [];

    const add = (raw: string | null | undefined) => {
        const normalized = normalizeStoragePath(raw);

        if (normalized) {
            pushUnique(paths, seen, normalized);
            pushUnique(paths, seen, decodePath(normalized));
        }

        if (raw && raw !== normalized) {
            const stripped = stripQueryAndHash(raw.trim()).replace(/^\/+/, "");

            if (
                stripped
                && !stripped.startsWith("http://")
                && !stripped.startsWith("https://")
            ) {
                pushUnique(paths, seen, stripped);
                pushUnique(paths, seen, decodePath(stripped));
            }
        }
    };

    add(attachment.filename);
    add(attachment.url);

    const workorderId = attachment.workorderId?.trim();
    const projectId = attachment.projectId?.trim();
    const original = attachment.originalName?.trim();
    const fileBase = attachment.filename
        ? basename(attachment.filename)
        : "";

    if (workorderId) {
        if (fileBase && !fileBase.startsWith("http")) {
            add(`correspondentie/${workorderId}/${fileBase}`);
        }

        if (original) {
            add(`correspondentie/${workorderId}/${original}`);
            add(`correspondentie/${workorderId}/${sanitizedName(original)}`);
        }
    }

    if (projectId) {
        if (fileBase && !fileBase.startsWith("http")) {
            add(`projecten/${projectId}/plattegronden/${fileBase}`);
        }

        if (original) {
            add(`projecten/${projectId}/plattegronden/${original}`);
            add(
                `projecten/${projectId}/plattegronden/${sanitizedName(original)}`
            );
        }
    }

    return paths;
}

function isMissingObject(
    error: { message?: string; statusCode?: string } | null
): boolean {
    if (!error) {
        return false;
    }

    const status = String(error.statusCode ?? "");
    const message = (error.message ?? "").toLowerCase();

    return (
        status === "404"
        || message.includes("not found")
        || message.includes("nosuchkey")
        || message.includes("object not found")
    );
}

async function downloadFromPath(path: string): Promise<Buffer | null> {
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .download(path);

    if (data && !error) {
        return Buffer.from(await data.arrayBuffer());
    }

    if (error && !isMissingObject(error)) {
        throw error;
    }

    return null;
}

function listedNameMatches(
    objectName: string,
    attachment: AttachmentStorageRef
): boolean {
    const lower = objectName.toLowerCase();
    const stripped = lower.replace(/^\d+-/, "");
    const wanted = [
        attachment.originalName,
        attachment.filename ? basename(attachment.filename) : null,
    ]
        .filter((value): value is string => Boolean(value?.trim()))
        .flatMap((value) => [value, sanitizedName(value)])
        .map((value) => value.toLowerCase());

    return wanted.some((name) => stripped === name || lower === name);
}

async function downloadFromListedFolder(
    folder: string,
    attachment: AttachmentStorageRef
): Promise<Buffer | null> {
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(folder, { limit: 1000 });

    if (error || !data?.length) {
        return null;
    }

    const match = data.find((item) => listedNameMatches(item.name, attachment));

    if (!match) {
        return null;
    }

    return downloadFromPath(`${folder}/${match.name}`);
}

function looksLikeJsonError(buffer: Buffer): boolean {
    const start = buffer.subarray(0, 40).toString("utf8").trimStart();

    return start.startsWith("{") && /"success"\s*:/.test(start);
}

async function downloadFromNasPath(nasPath: string): Promise<Buffer | null> {
    try {
        const buffer = await synologyDownloadFile(nasPath);

        if (!buffer.length || looksLikeJsonError(buffer)) {
            return null;
        }

        return buffer;
    } catch {
        return null;
    }
}

function nasNameCandidates(attachment: AttachmentStorageRef): string[] {
    const names: string[] = [];
    const seen = new Set<string>();

    for (const raw of [
        attachment.originalName,
        attachment.filename ? basename(attachment.filename) : null,
    ]) {
        const name = raw?.trim();

        if (!name || seen.has(name)) {
            continue;
        }

        seen.add(name);
        names.push(name);
    }

    return names;
}

async function downloadFromNas(
    attachment: AttachmentStorageRef
): Promise<Buffer | null> {
    const root = attachment.archiveNasPath?.trim();

    if (!root || !isNasArchiveEnabled()) {
        return null;
    }

    const folders = [root, joinNasPath(root, "correspondentie")];
    const names = nasNameCandidates(attachment);

    for (const folder of folders) {
        for (const name of names) {
            const buffer = await downloadFromNasPath(joinNasPath(folder, name));

            if (buffer) {
                return buffer;
            }
        }
    }

    for (const folder of folders) {
        const files = await synologyListFiles(folder).catch(() => []);

        const match = files.find((file) =>
            !file.isDir && listedNameMatches(file.name, attachment)
        );

        if (match) {
            const buffer = await downloadFromNasPath(match.path);

            if (buffer) {
                return buffer;
            }
        }
    }

    return null;
}

export function attachmentStoragePath(
    attachment: AttachmentStorageRef
): string | null {
    return candidateStoragePaths(attachment)[0] ?? null;
}

export async function downloadAttachmentBytes(
    attachment: AttachmentStorageRef
): Promise<Buffer> {
    const directNas = nasPathFromStored(attachment.filename)
        || nasPathFromStored(attachment.url);

    if (directNas) {
        const fromPath = await downloadFromNasPath(directNas);

        if (fromPath) {
            return fromPath;
        }
    }

    const paths = candidateStoragePaths(attachment);
    let lastError: unknown = null;

    for (const path of paths) {
        try {
            const buffer = await downloadFromPath(path);

            if (buffer) {
                return buffer;
            }
        } catch (error) {
            lastError = error;
        }
    }

    const workorderId = attachment.workorderId?.trim();

    if (workorderId) {
        const listed = await downloadFromListedFolder(
            `correspondentie/${workorderId}`,
            attachment
        );

        if (listed) {
            return listed;
        }
    }

    const projectId = attachment.projectId?.trim();

    if (projectId) {
        const listed = await downloadFromListedFolder(
            `projecten/${projectId}/plattegronden`,
            attachment
        );

        if (listed) {
            return listed;
        }
    }

    const fromNas = await downloadFromNas(attachment);

    if (fromNas) {
        return fromNas;
    }

    console.error(
        "ATTACHMENT STORAGE MISS",
        attachment.originalName || attachment.filename,
        paths
    );

    if (lastError && !(lastError instanceof AttachmentNotFoundError)) {
        const message =
            lastError instanceof Error ? lastError.message.toLowerCase() : "";

        if (
            !isMissingObject(lastError as { message?: string })
            && !message.includes("not found")
            && !message.includes("nosuchkey")
        ) {
            throw lastError;
        }
    }

    throw new AttachmentNotFoundError();
}

export async function removeAttachmentObject(
    attachment: AttachmentStorageRef
): Promise<void> {
    const nasPath = nasPathFromStored(attachment.filename)
        || nasPathFromStored(attachment.url);

    if (nasPath) {
        await synologyDeleteFile(nasPath).catch(() => {});
    }

    const paths = candidateStoragePaths(attachment);

    if (paths.length === 0) {
        return;
    }

    await supabase.storage.from(BUCKET).remove(paths).catch(() => {});
}

export async function uploadStorageObject(options: {
    path: string;
    buffer: Buffer;
    contentType: string;
    fallbackPaths?: string[];
}): Promise<{ path: string }> {
    const paths = [options.path, ...(options.fallbackPaths ?? [])];
    const types = [
        options.contentType,
        "application/octet-stream",
    ].filter((type, index, list) => type && list.indexOf(type) === index);

    let lastError: { message?: string } | null = null;

    for (const path of paths) {
        for (const contentType of types) {
            const { data, error } = await supabase.storage
                .from(BUCKET)
                .upload(path, new Uint8Array(options.buffer), {
                    contentType,
                    upsert: false,
                });

            if (data?.path && !error) {
                return { path: data.path };
            }

            lastError = error;
        }
    }

    throw new Error(
        lastError?.message || "Bestand kon niet in de opslag worden gezet"
    );
}
