import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/guard";
import { renameArchiveFolder } from "@/lib/archive/ensureArchiveFolders";

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
