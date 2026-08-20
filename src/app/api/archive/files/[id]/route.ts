import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireApiUser } from "@/lib/auth/guard";
import { synologyDownloadFile, synologyMove } from "@/lib/nas/synologyClient";
import { isNasArchiveEnabled, joinNasPath } from "@/lib/nas/synologyConfig";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const guard = await requireApiUser();

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;
        const file = await prisma.archiveFile.findUnique({
            where: { id },
        });

        if (!file) {
            return NextResponse.json(
                { error: "Bestand niet gevonden" },
                { status: 404 }
            );
        }

        let buffer: Buffer;

        if (file.storage === "nas") {
            buffer = await synologyDownloadFile(file.storagePath);
        } else {
            const download = await supabase.storage
                .from("workorder-files")
                .download(file.storagePath);

            if (download.error || !download.data) {
                return NextResponse.json(
                    { error: "Bestand niet gevonden in opslag" },
                    { status: 404 }
                );
            }

            buffer = Buffer.from(await download.data.arrayBuffer());
        }

        const filename = file.name.replace(/"/g, "");

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": file.contentType || "application/octet-stream",
                "Content-Disposition": `inline; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("ARCHIVE FILE GET ERROR", error);

        return NextResponse.json(
            { error: "Bestand ophalen mislukt" },
            { status: 500 }
        );
    }
}

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
        const body = await request.json() as { folderId?: string };
        const folderId = body.folderId?.trim();

        if (!folderId) {
            return NextResponse.json(
                { error: "Geen map opgegeven" },
                { status: 400 }
            );
        }

        const file = await prisma.archiveFile.findUnique({
            where: { id },
        });

        if (!file) {
            return NextResponse.json(
                { error: "Bestand niet gevonden" },
                { status: 404 }
            );
        }

        const folder = await prisma.archiveFolder.findUnique({
            where: { id: folderId },
        });

        if (!folder) {
            return NextResponse.json(
                { error: "Map niet gevonden" },
                { status: 404 }
            );
        }

        let storagePath = file.storagePath;

        if (file.storage === "nas" && isNasArchiveEnabled()) {
            storagePath = await synologyMove(file.storagePath, folder.nasPath);
        } else if (file.storage === "nas") {
            storagePath = joinNasPath(folder.nasPath, file.name);
        }

        const updated = await prisma.archiveFile.update({
            where: { id: file.id },
            data: { folderId: folder.id, storagePath },
        });

        return NextResponse.json({
            file: {
                id: updated.id,
                name: updated.name,
                folderId: updated.folderId,
            },
        });
    } catch (error) {
        console.error("ARCHIVE FILE MOVE ERROR", error);

        return NextResponse.json(
            { error: "Bestand verplaatsen mislukt" },
            { status: 500 }
        );
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
        const file = await prisma.archiveFile.findUnique({
            where: { id },
        });

        if (!file) {
            return NextResponse.json(
                { error: "Bestand niet gevonden" },
                { status: 404 }
            );
        }

        if (file.storage !== "nas") {
            await supabase.storage
                .from("workorder-files")
                .remove([file.storagePath])
                .catch(() => {});
        }

        await prisma.archiveFile.delete({ where: { id: file.id } });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("ARCHIVE FILE DELETE ERROR", error);

        return NextResponse.json(
            { error: "Bestand verwijderen mislukt" },
            { status: 500 }
        );
    }
}
