import {
    mkdir,
    readdir,
    readFile,
    rename,
    rm,
    stat,
    writeFile,
} from "node:fs/promises";
import path from "node:path";

import {
    archiveFsRoot,
    joinNasPath,
    synologyArchiveRoot,
} from "@/lib/nas/synologyConfig";

function requireFsRoot(): string {
    const root = archiveFsRoot();

    if (!root) {
        throw new Error("NAS_MOUNT_PATH / ARCHIVE_FS_ROOT ontbreekt");
    }

    return root;
}

/** Logisch NAS-pad → pad op de lokale mount/mock. */
export function nasPathToFsPath(nasPath: string): string {
    const root = requireFsRoot();
    const archiveRoot = synologyArchiveRoot();
    const normalized = joinNasPath(nasPath);

    let relative = normalized.replace(/^\//, "");

    if (normalized === archiveRoot) {
        relative = "";
    } else if (normalized.startsWith(`${archiveRoot}/`)) {
        relative = normalized.slice(archiveRoot.length + 1);
    }

    const segments = relative.split("/").filter(Boolean);

    return path.join(root, ...segments);
}

export async function fsEnsureFolder(nasPath: string): Promise<void> {
    await mkdir(nasPathToFsPath(nasPath), { recursive: true });
}

export async function fsDeletePath(nasPath: string): Promise<void> {
    await rm(nasPathToFsPath(nasPath), { recursive: true, force: true });
}

export async function fsUploadFile(
    destFolder: string,
    filename: string,
    buffer: Buffer
): Promise<string> {
    await fsEnsureFolder(destFolder);
    const target = nasPathToFsPath(joinNasPath(destFolder, filename));
    await writeFile(target, buffer);
    return joinNasPath(destFolder, filename);
}

export async function fsRename(
    nasPath: string,
    newName: string
): Promise<string> {
    const from = nasPathToFsPath(nasPath);
    const parent = path.dirname(from);
    const to = path.join(parent, newName);
    await rename(from, to);

    const parentNas = nasPath.replace(/\/[^/]+$/, "") || synologyArchiveRoot();
    return joinNasPath(parentNas, newName);
}

export async function fsMove(
    nasPath: string,
    destFolder: string
): Promise<string> {
    await fsEnsureFolder(destFolder);
    const filename = nasPath.split("/").filter(Boolean).pop() || "bestand";
    const from = nasPathToFsPath(nasPath);
    const to = nasPathToFsPath(joinNasPath(destFolder, filename));
    await rename(from, to);
    return joinNasPath(destFolder, filename);
}

export async function fsListFiles(
    folderPath: string
): Promise<Array<{ name: string; path: string; isDir: boolean }>> {
    try {
        const dir = nasPathToFsPath(folderPath);
        const entries = await readdir(dir, { withFileTypes: true });

        return entries.map((entry) => ({
            name: entry.name,
            path: joinNasPath(folderPath, entry.name),
            isDir: entry.isDirectory(),
        }));
    } catch {
        return [];
    }
}

export async function fsDownloadFile(nasPath: string): Promise<Buffer> {
    return readFile(nasPathToFsPath(nasPath));
}

export async function fsPathExists(nasPath: string): Promise<boolean> {
    try {
        await stat(nasPathToFsPath(nasPath));
        return true;
    } catch {
        return false;
    }
}
