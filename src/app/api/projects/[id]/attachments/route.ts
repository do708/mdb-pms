import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireProjectAccess } from "@/lib/auth/guard";
import {
    contentTypeForFile,
    extensionForContentType,
} from "@/lib/attachments/contentType";
import { uploadStorageObject } from "@/lib/attachments/storage";
import {
    compressPhoto,
    photoStorageName,
} from "@/lib/images/compressPhoto";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        const { id } = await context.params;
        const guard = await requireProjectAccess(id);

        if (!guard.ok) {
            return guard.response;
        }

        const bijlagen = await prisma.projectAttachment.findMany({
            where: { projectId: id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(bijlagen);
    } catch (error) {
        console.error("PROJECT ATTACHMENTS GET ERROR:", error);

        return NextResponse.json(
            { error: "Bijlagen ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        const { id } = await context.params;
        const guard = await requireApiRole(["admin", "office"]);

        if (!guard.ok) {
            return guard.response;
        }

        const project = await prisma.project.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project niet gevonden" },
                { status: 404 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (
            !file
            || typeof file === "string"
            || typeof (file as File).arrayBuffer !== "function"
            || (file as File).size <= 0
        ) {
            return NextResponse.json(
                { error: "Geen bestand ontvangen" },
                { status: 400 }
            );
        }

        const upload = file as File;
        const contentType = contentTypeForFile(upload);
        const raw = Buffer.from(await upload.arrayBuffer());
        const payload = contentType.startsWith("image/")
            ? await compressPhoto(raw, contentType)
            : {
                buffer: raw,
                contentType,
                extension: extensionForContentType(upload.name, contentType),
            };

        const veiligeNaam = payload.extension
            ? photoStorageName(upload.name, payload.extension)
            : upload.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const stamp = Date.now();
        const nestedPath =
            `projecten/${id}/plattegronden/${stamp}-${veiligeNaam}`;
        const flatPath = `plattegronden/${id}/${stamp}-${veiligeNaam}`;

        const stored = await uploadStorageObject({
            path: nestedPath,
            buffer: payload.buffer,
            contentType: payload.contentType || contentType,
            fallbackPaths: [flatPath],
        });

        const publicUrl = supabase.storage
            .from("workorder-files")
            .getPublicUrl(stored.path).data.publicUrl;

        const attachment = await prisma.projectAttachment.create({
            data: {
                projectId: id,
                url: publicUrl,
                filename: stored.path,
                originalName: upload.name,
                contentType: payload.contentType || contentType,
            },
        });

        return NextResponse.json(attachment);
    } catch (error) {
        console.error("PROJECT ATTACHMENTS POST ERROR:", error);

        const message =
            error instanceof Error ? error.message : "";
        const lower = message.toLowerCase();
        const hint =
            /projectattachment|does not exist|p2021/i.test(message)
                ? "Database mist de plattegrondentabel — voer prisma migrate deploy uit."
                : /payload|too large|request entity|413/i.test(lower)
                  ? "Bestand is te groot. Gebruik een kleinere PDF of PNG (max. circa 4,5 MB)."
                  : message || "Bijlage opslaan mislukt";

        return NextResponse.json(
            { error: hint },
            { status: 500 }
        );
    }
}
