import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { createClient } from "@supabase/supabase-js";
import { requireWorkorderAccess } from "@/lib/auth/guard";
import { zonderInstructieFotos, isInfoFotoVanInstructie } from "@/lib/werkInstructie/parseWerkInstructie";
import {
    compressPhoto,
    photoStorageName,
} from "@/lib/images/compressPhoto";

export const maxDuration = 60;
export const runtime = "nodejs";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function isUploadFile(value: FormDataEntryValue): value is File {
    return (
        typeof value !== "string"
        && typeof (value as File).arrayBuffer === "function"
        && (value as File).size > 0
    );
}

function isBlockedPhotoHost(hostname: string): boolean {
    const h = hostname.toLowerCase().replace(/\.$/, "");
    if (
        h === "localhost"
        || h === "127.0.0.1"
        || h === "0.0.0.0"
        || h === "::1"
        || h.endsWith(".local")
        || h.endsWith(".internal")
    ) {
        return true;
    }
    if (/^(10\.|192\.168\.|169\.254\.)/.test(h)) {
        return true;
    }
    const m = /^172\.(\d+)\./.exec(h);
    if (m) {
        const n = Number(m[1]);
        if (n >= 16 && n <= 31) {
            return true;
        }
    }
    return false;
}

function looksLikeImage(buffer: Buffer): boolean {
    if (buffer.length < 12) {
        return false;
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        return true;
    }
    if (
        buffer[0] === 0x89
        && buffer[1] === 0x50
        && buffer[2] === 0x4e
        && buffer[3] === 0x47
    ) {
        return true;
    }
    if (
        buffer.slice(0, 4).toString("ascii") === "RIFF"
        && buffer.slice(8, 12).toString("ascii") === "WEBP"
    ) {
        return true;
    }
    return false;
}

async function storePhotoBuffer(args: {
    workorderId: string;
    buffer: Buffer;
    contentType: string;
    originalName: string;
}) {
    let payload: Buffer = args.buffer;
    let contentType = args.contentType || "image/jpeg";
    let extension = ".jpg";

    try {
        const compressed = await compressPhoto(
            args.buffer,
            args.contentType || "image/jpeg"
        );
        payload = Buffer.from(compressed.buffer);
        contentType = compressed.contentType;
        extension = compressed.extension || ".jpg";
    } catch (compressError) {
        console.warn("PHOTO COMPRESS FAILED", compressError);
    }

    const filename = `${args.workorderId}/${Date.now()}-${photoStorageName(
        args.originalName || "foto",
        extension
    )}`;

    const upload = await supabase.storage
        .from("workorder-files")
        .upload(filename, payload, {
            contentType,
            upsert: true,
        });

    if (upload.error) {
        throw new Error(
            upload.error.message || "Opslag van de foto is mislukt"
        );
    }

    const url = supabase.storage
        .from("workorder-files")
        .getPublicUrl(filename).data.publicUrl;

    return prisma.workorderPhoto.create({
        data: {
            workorderId: args.workorderId,
            url,
            filename: args.originalName || null,
        },
    });
}

async function importPhotoFromUrl(workorderId: string, rawUrl: string) {
    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error("Ongeldige fotolink");
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Alleen http(s)-fotolinks zijn toegestaan");
    }

    if (isBlockedPhotoHost(parsed.hostname)) {
        throw new Error("Deze fotolink is niet toegestaan");
    }

    try {
        const response = await fetch(parsed.toString(), {
            redirect: "follow",
            headers: { Accept: "image/*,*/*" },
        });

        if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            const contentType =
                response.headers.get("content-type") || "";
            const imageType = contentType.split(";")[0].trim();
            if (
                buffer.length > 0
                && buffer.length <= 12 * 1024 * 1024
                && (imageType.startsWith("image/") || looksLikeImage(buffer))
            ) {
                const pathName = parsed.pathname.split("/").pop() || "foto";
                return storePhotoBuffer({
                    workorderId,
                    buffer,
                    contentType: imageType.startsWith("image/")
                        ? imageType
                        : "image/jpeg",
                    originalName: decodeURIComponent(pathName),
                });
            }
        }
    } catch (error) {
        console.warn("PHOTO URL FETCH FAILED", rawUrl, error);
    }

    return prisma.workorderPhoto.create({
        data: {
            workorderId,
            url: parsed.toString(),
            filename: "Foto link",
            caption: parsed.toString(),
        },
    });
}

export async function POST(
    request: NextRequest,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        const { id } = await context.params;

        const guard = await requireWorkorderAccess(id);

        if (!guard.ok) {
            return guard.response;
        }

            const workorder = await prisma.workorder.findUnique({
                where: { id },
                select: { id: true, werkInstructie: true },
            });

        if (!workorder) {
            return NextResponse.json(
                { error: "Opdracht niet gevonden" },
                { status: 404 }
            );
        }

        if (
            !process.env.NEXT_PUBLIC_SUPABASE_URL
            || !process.env.SUPABASE_SERVICE_ROLE_KEY
        ) {
            console.error("PHOTO UPLOAD: Supabase env ontbreekt");
            return NextResponse.json(
                { error: "Foto-opslag is niet geconfigureerd" },
                { status: 500 }
            );
        }

        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            const body = (await request.json()) as { urls?: unknown };
            const urls = Array.isArray(body.urls)
                ? body.urls.filter(
                    (u): u is string =>
                        typeof u === "string" && /^https?:\/\//i.test(u.trim())
                )
                : [];

            const teImporteren = urls.filter(
                (url) =>
                    !isInfoFotoVanInstructie(
                        { url: url.trim() },
                        workorder.werkInstructie
                    )
            );

            if (teImporteren.length === 0) {
                return NextResponse.json({
                    success: true,
                    photos: [],
                });
            }

            const uploadedPhotos = [];
            for (const url of teImporteren.slice(0, 12)) {
                uploadedPhotos.push(
                    await importPhotoFromUrl(id, url.trim())
                );
            }

            return NextResponse.json({
                success: true,
                photos: uploadedPhotos,
            });
        }

        const formData = await request.formData();
        const files = formData.getAll("photos").filter(isUploadFile);

        if (files.length === 0) {
            return NextResponse.json(
                { error: "Geen foto's ontvangen" },
                { status: 400 }
            );
        }

        const uploadedPhotos = [];

        for (const file of files) {
            const rawBuffer = Buffer.from(await file.arrayBuffer());

            if (rawBuffer.length === 0) {
                continue;
            }

            let payload: Buffer = Buffer.from(rawBuffer);
            let contentType = file.type || "image/jpeg";
            let extension = ".jpg";

            try {
                const compressed = await compressPhoto(
                    rawBuffer,
                    file.type || "image/jpeg"
                );
                payload = Buffer.from(compressed.buffer);
                contentType = compressed.contentType;
                extension = compressed.extension || ".jpg";
            } catch (compressError) {
                console.warn("PHOTO COMPRESS FAILED", compressError);
            }

            const filename = `${id}/${Date.now()}-${photoStorageName(
                file.name || "foto",
                extension
            )}`;

            const upload = await supabase.storage
                .from("workorder-files")
                .upload(filename, payload, {
                    contentType,
                    upsert: true,
                });

            if (upload.error) {
                console.error("PHOTO STORAGE ERROR", upload.error);
                throw new Error(
                    upload.error.message || "Opslag van de foto is mislukt"
                );
            }

            const url = supabase.storage
                .from("workorder-files")
                .getPublicUrl(filename).data.publicUrl;

            const photo = await prisma.workorderPhoto.create({
                data: {
                    workorderId: id,
                    url,
                    filename: file.name || null,
                },
            });

            uploadedPhotos.push(photo);
        }

        if (uploadedPhotos.length === 0) {
            return NextResponse.json(
                { error: "Geen geldige foto ontvangen" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            photos: uploadedPhotos,
        });
    } catch (error) {
        console.error("PHOTO UPLOAD ERROR", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Foto upload mislukt",
            },
            { status: 500 }
        );
    }
}

export async function GET(
    _request: NextRequest,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        const { id } = await context.params;

        const guard = await requireWorkorderAccess(id);

        if (!guard.ok) {
            return guard.response;
        }

        const workorder = await prisma.workorder.findUnique({
            where: { id },
            select: { werkInstructie: true },
        });

        const photos = zonderInstructieFotos(
            await prisma.workorderPhoto.findMany({
                where: { workorderId: id },
                orderBy: { createdAt: "asc" },
            }),
            workorder?.werkInstructie
        );

        return NextResponse.json({
            photos,
        });
    } catch (error) {
        console.error("PHOTO LIST ERROR", error);

        return NextResponse.json(
            { error: "Foto's ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        const { id } = await context.params;

        const guard = await requireWorkorderAccess(id);

        if (!guard.ok) {
            return guard.response;
        }

        const body = (await request.json()) as {
            photoId?: string;
            caption?: string;
        };

        if (!body.photoId) {
            return NextResponse.json(
                { error: "photoId ontbreekt" },
                { status: 400 }
            );
        }

        const photo = await prisma.workorderPhoto.findFirst({
            where: {
                id: body.photoId,
                workorderId: id,
            },
        });

        if (!photo) {
            return NextResponse.json(
                { error: "Foto niet gevonden" },
                { status: 404 }
            );
        }

        const updated = await prisma.workorderPhoto.update({
            where: { id: photo.id },
            data: {
                caption:
                    typeof body.caption === "string"
                        ? body.caption
                        : photo.caption,
            },
        });

        return NextResponse.json({
            photo: updated,
        });
    } catch (error) {
        console.error("PHOTO PATCH ERROR", error);

        return NextResponse.json(
            { error: "Foto bijwerken mislukt" },
            { status: 500 }
        );
    }
}
