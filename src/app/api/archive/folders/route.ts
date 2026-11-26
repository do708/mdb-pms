import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireApiUser } from "@/lib/auth/guard";
import {
    deleteArchiveFolder,
    ensureNamedArchiveFolder,
    syncCompletedProjectArchiveFolders,
} from "@/lib/archive/ensureArchiveFolders";
import {
    hideArchiveFolderPath,
    listArchiveHiddenPathKeys,
} from "@/lib/archive/ensureArchiveHiddenPaths";
import { syncArchiveFoldersFromNas } from "@/lib/archive/syncArchiveFromNas";
import { supabase } from "@/lib/supabase/admin";

function serializeFile(file: {
    id: string;
    name: string;
    contentType: string | null;
    size: number | null;
    createdAt: Date;
}) {
    return {
        id: file.id,
        name: file.name,
        contentType: file.contentType,
        size: file.size,
        createdAt: file.createdAt.toISOString(),
        url: `/api/archive/files/${file.id}`,
    };
}

export async function GET() {
    const guard = await requireApiUser();

    if (!guard.ok) {
        return guard.response;
    }

    try {
        await syncCompletedProjectArchiveFolders().catch((error) => {
            console.error("ARCHIVE PROJECT FOLDERS SYNC ERROR", error);
        });

        await syncArchiveFoldersFromNas().catch((error) => {
            console.error("ARCHIVE NAS FOLDERS SYNC ERROR", error);
        });

        const folders = await prisma.archiveFolder.findMany({
            where: { kind: { not: "workorder" } },
            orderBy: { name: "asc" },
            include: {
                files: { orderBy: { createdAt: "desc" } },
            },
        });

        const byParent = new Map<string | null, typeof folders>();

        for (const folder of folders) {
            const key = folder.parentId;
            const list = byParent.get(key) ?? [];
            list.push(folder);
            byParent.set(key, list);
        }

        function toNode(folder: (typeof folders)[number]): unknown {
            return {
                id: folder.id,
                name: folder.name,
                kind: folder.kind,
                parentId: folder.parentId,
                files: folder.files.map(serializeFile),
                children: (byParent.get(folder.id) ?? []).map(toNode),
            };
        }

        const hiddenPaths = await listArchiveHiddenPathKeys();

        return NextResponse.json({
            folders: (byParent.get(null) ?? []).map(toNode),
            hiddenPaths,
        });
    } catch (error) {
        console.error("ARCHIVE FOLDERS ERROR", error);

        return NextResponse.json(
            { error: "Archiefmappen ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const body = await request.json() as {
            name?: string;
            parentId?: string | null;
        };

        const name = body.name?.trim() ?? "";

        if (!name) {
            return NextResponse.json(
                { error: "Mapnaam ontbreekt" },
                { status: 400 }
            );
        }

        const folder = await ensureNamedArchiveFolder({
            name,
            parentId: body.parentId ?? null,
            kind: "custom",
        });

        return NextResponse.json({
            folder: {
                id: folder.id,
                name: folder.name,
                kind: folder.kind,
                parentId: folder.parentId,
            },
        });
    } catch (error) {
        console.error("ARCHIVE FOLDER CREATE ERROR", error);

        const message =
            error instanceof Error ? error.message : "Map aanmaken mislukt";

        return NextResponse.json({ error: message }, { status: 400 });
    }
}

/**
 * Verwijder een archiefmap (DB + NAS) en/of verberg een virtueel pad
 * uit de boom. Opdrachten zelf blijven bestaan.
 */
export async function DELETE(request: NextRequest) {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const body = (await request.json().catch(() => null)) as {
            folderId?: string | null;
            path?: string[];
        } | null;

        const folderId = body?.folderId?.trim() || null;
        const path = Array.isArray(body?.path)
            ? body.path.filter((part): part is string => typeof part === "string")
            : [];

        if (!folderId && path.length === 0) {
            return NextResponse.json(
                { error: "Map of pad ontbreekt" },
                { status: 400 }
            );
        }

        if (path.length > 0) {
            await hideArchiveFolderPath(path);
        }

        let files: Awaited<ReturnType<typeof deleteArchiveFolder>> = [];

        if (folderId) {
            files = await deleteArchiveFolder(folderId);
        }

        const supabasePaths = files
            .filter((file) => file.storage !== "nas")
            .map((file) => file.storagePath)
            .filter(Boolean);

        if (supabasePaths.length > 0) {
            await supabase.storage
                .from("workorder-files")
                .remove(supabasePaths)
                .catch(() => {});
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("ARCHIVE FOLDER DELETE ERROR", error);

        const message =
            error instanceof Error ? error.message : "Verwijderen mislukt";
        const status = message === "Map niet gevonden" ? 404 : 400;

        return NextResponse.json({ error: message }, { status });
    }
}
