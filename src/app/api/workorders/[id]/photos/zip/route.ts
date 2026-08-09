import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";

export const maxDuration = 60;

function extensionFromUrl(url: string, contentType: string | null): string {
    try {
        const path = new URL(url).pathname;
        const match = path.match(/\.([a-zA-Z0-9]{2,5})$/);
        if (match) {
            return match[1].toLowerCase();
        }
    } catch {
        // negeer ongeldige URL
    }

    if (contentType?.includes("png")) return "png";
    if (contentType?.includes("webp")) return "webp";
    if (contentType?.includes("gif")) return "gif";
    return "jpg";
}

function safeZipName(value: string): string {
    return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function GET(
    _request: NextRequest,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        const guard = await requireApiRole(["admin", "office"]);

        if (!guard.ok) {
            return guard.response;
        }

        const { id } = await context.params;

        const workorder = await prisma.workorder.findUnique({
            where: { id },
            select: {
                id: true,
                number: true,
                photos: {
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        url: true,
                        filename: true,
                        caption: true,
                    },
                },
            },
        });

        if (!workorder) {
            return NextResponse.json(
                { error: "Opdracht niet gevonden" },
                { status: 404 }
            );
        }

        if (workorder.photos.length === 0) {
            return NextResponse.json(
                { error: "Geen foto's op deze opdracht" },
                { status: 404 }
            );
        }

        const zip = new JSZip();
        let added = 0;

        for (let index = 0; index < workorder.photos.length; index++) {
            const photo = workorder.photos[index];

            try {
                const response = await fetch(photo.url);

                if (!response.ok) {
                    console.error(
                        "PHOTO ZIP FETCH FAILED",
                        photo.id,
                        response.status
                    );
                    continue;
                }

                const contentType = response.headers.get("content-type");
                const buffer = Buffer.from(await response.arrayBuffer());
                const ext = extensionFromUrl(photo.url, contentType);
                const base =
                    safeZipName(
                        photo.filename
                            || photo.caption
                            || `foto-${index + 1}`
                    ).replace(/\.[a-zA-Z0-9]+$/, "")
                    || `foto-${index + 1}`;

                zip.file(
                    `${String(index + 1).padStart(2, "0")}-${base}.${ext}`,
                    buffer
                );
                added += 1;
            } catch (error) {
                console.error("PHOTO ZIP FETCH ERROR", photo.id, error);
            }
        }

        if (added === 0) {
            return NextResponse.json(
                { error: "Foto's konden niet worden gedownload" },
                { status: 502 }
            );
        }

        const zipBuffer = await zip.generateAsync({
            type: "nodebuffer",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
        });

        const filename = `${safeZipName(workorder.number)}-fotos.zip`;

        return new NextResponse(new Uint8Array(zipBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("WORKORDER PHOTOS ZIP ERROR", error);

        return NextResponse.json(
            { error: "ZIP download mislukt" },
            { status: 500 }
        );
    }
}
