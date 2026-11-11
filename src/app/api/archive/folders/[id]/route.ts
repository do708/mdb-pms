import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/guard";
import {
    deleteArchiveFolder,
    renameArchiveFolder,
} from "@/lib/archive/ensureArchiveFolders";
import { supabase } from "@/lib/supabase/admin";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;
        const body = await request.json() as { name?: string };
        const name = body.name?.trim() ?? "";

        if (!name) {
            return NextResponse.json(
                { error: "Mapnaam ontbreekt" },
                { status: 400 }
            );
        }

        const folder = await renameArchiveFolder(id, name);

        return NextResponse.json({
            folder: {
                id: folder.id,
                name: folder.name,
                kind: folder.kind,
                parentId: folder.parentId,
            },
        });
    } catch (error) {
        console.error("ARCHIVE FOLDER RENAME ERROR", error);

        const message =
            error instanceof Error ? error.message : "Hernoemen mislukt";

        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;
        const files = await deleteArchiveFolder(id);
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
