import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { buildWorkorderPhotosZip } from "@/lib/workorders/buildPhotosZip";
import { zonderInstructieFotos } from "@/lib/werkInstructie/parseWerkInstructie";

export const maxDuration = 60;

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
                werkInstructie: true,
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

        const fotos = zonderInstructieFotos(
            workorder.photos,
            workorder.werkInstructie
        );

        if (fotos.length === 0) {
            return NextResponse.json(
                { error: "Geen foto's op deze opdracht" },
                { status: 404 }
            );
        }

        const zipBuffer = await buildWorkorderPhotosZip(fotos);

        if (!zipBuffer) {
            return NextResponse.json(
                { error: "Foto's konden niet worden gedownload" },
                { status: 502 }
            );
        }

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
