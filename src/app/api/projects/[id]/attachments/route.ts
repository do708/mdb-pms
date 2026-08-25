import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireProjectAccess } from "@/lib/auth/guard";
import {
    contentTypeForFile,
    extensionForContentType,
} from "@/lib/attachments/contentType";
import { uploadStorageObject } from "@/lib/attachments/storage";
import { storeProjectFile } from "@/lib/projects/plattegrondStorage";
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

        const kindParam = request.nextUrl.searchParams.get("kind");
        const kindFilter =
            kindParam === "intake" || kindParam === "plattegrond"
                ? kindParam
                : undefined;

        const bijlagen = await prisma.projectAttachment.findMany({
            where: {
                projectId: id,
                ...(kindFilter ? { kind: kindFilter } : {}),
            },
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
            select: {
                id: true,
                number: true,
                name: true,
                customer: { select: { name: true } },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project niet gevonden" },
                { status: 404 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const kind =
            formData.get("kind") === "intake" ? "intake" : "plattegrond";
        const folder = kind === "intake" ? "intake" : "plattegronden";

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
            `projecten/${id}/${folder}/${stamp}-${veiligeNaam}`;
        const flatPath = `${folder}/${id}/${stamp}-${veiligeNaam}`;

        const stored = await storeProjectFile({
            project,
            filename: `${stamp}-${veiligeNaam}`,
            buffer: payload.buffer,
            contentType: payload.contentType || contentType,
            folder,
            supabaseUpload: async () => {
                const uploaded = await uploadStorageObject({
                    path: nestedPath,
                    buffer: payload.buffer,
                    contentType: payload.contentType || contentType,
                    fallbackPaths: [flatPath],
                });
                const publicUrl = supabase.storage
                    .from("workorder-files")
                    .getPublicUrl(uploaded.path).data.publicUrl;

                return { path: uploaded.path, url: publicUrl };
            },
        });

        const attachment = await prisma.projectAttachment.create({
            data: {
                projectId: id,
                url: stored.url,
                filename: stored.path,
                originalName: upload.name,
                contentType: payload.contentType || contentType,
                kind,
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
                  : /synology|nas|quickconnect/i.test(lower)
                    ? `Opslaan op de NAS mislukt: ${message}`
                    : message || "Bijlage opslaan mislukt";

        return NextResponse.json(
            { error: hint },
            { status: 500 }
        );
    }
}
