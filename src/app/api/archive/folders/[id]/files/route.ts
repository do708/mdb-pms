import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { archiveSlug } from "@/lib/archive/formatArchiveLocationName";
import {
    synologyUploadFile,
} from "@/lib/nas/synologyClient";
import { isNasArchiveEnabled, joinNasPath } from "@/lib/nas/synologyConfig";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;
        const folder = await prisma.archiveFolder.findUnique({
            where: { id },
        });

        if (!folder) {
            return NextResponse.json(
                { error: "Map niet gevonden" },
                { status: 404 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Geen bestand ontvangen" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name || "bestand";
        const lastDot = originalName.lastIndexOf(".");
        const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
        const ext = lastDot > 0 ? originalName.slice(lastDot) : "";
        const nasFileName = `${archiveSlug(baseName)}${ext.replace(/[^a-zA-Z0-9.]/g, "")}`;
        const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const contentType = file.type || "application/octet-stream";

        let storage = "supabase";
        let storagePath = `archief/${folder.id}/${safeName}`;
        let url: string | null = null;

        if (isNasArchiveEnabled()) {
            storage = "nas";
            storagePath = await synologyUploadFile(
                folder.nasPath,
                nasFileName,
                buffer,
                contentType
            );
        } else {
            const upload = await supabase.storage
                .from("workorder-files")
                .upload(storagePath, buffer, {
                    contentType,
                    upsert: false,
                });

            if (upload.error) {
                return NextResponse.json(
                    { error: upload.error.message },
                    { status: 500 }
                );
            }

            url = supabase.storage
                .from("workorder-files")
                .getPublicUrl(upload.data.path).data.publicUrl;
            storagePath = upload.data.path;
        }

        const saved = await prisma.archiveFile.create({
            data: {
                folderId: folder.id,
                name: originalName,
                storage,
                storagePath,
                url,
                contentType,
                size: buffer.length,
            },
        });

        return NextResponse.json({
            file: {
                id: saved.id,
                name: saved.name,
                contentType: saved.contentType,
                size: saved.size,
                createdAt: saved.createdAt.toISOString(),
                url: `/api/archive/files/${saved.id}`,
            },
        });
    } catch (error) {
        console.error("ARCHIVE FILE UPLOAD ERROR", error);

        return NextResponse.json(
            { error: "Bestand opslaan mislukt" },
            { status: 500 }
        );
    }
}
