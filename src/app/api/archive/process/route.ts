import { NextResponse } from "next/server";
import { after } from "next/server";

import { requireApiRole } from "@/lib/auth/guard";
import {
    archiveWorkorderToNas,
    processPendingArchives,
} from "@/lib/archive/archiveWorkorderToNas";
import { isNasArchiveEnabled } from "@/lib/nas/synologyConfig";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;

export async function POST(request: Request) {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    if (!isNasArchiveEnabled()) {
        return NextResponse.json(
            {
                error:
                    "NAS-archief staat uit (STORAGE_ARCHIVE_ENABLED=false)",
            },
            { status: 503 }
        );
    }

    try {
        const body = await request.json().catch(() => ({}));
        const workorderId =
            typeof body.workorderId === "string"
                ? body.workorderId
                : null;

        if (workorderId) {
            after(async () => {
                try {
                    await archiveWorkorderToNas(workorderId);
                } catch (error) {
                    console.error(
                        "ARCHIVE WORKORDER ERROR",
                        workorderId,
                        error
                    );
                }
            });

            await prisma.workorder.update({
                where: { id: workorderId },
                data: {
                    archiveStatus: "pending",
                    archiveError: null,
                },
            });

            return NextResponse.json({
                queued: true,
                workorderId,
            });
        }

        const results = await processPendingArchives(20);

        return NextResponse.json({ results });
    } catch (error) {
        console.error("ARCHIVE PROCESS ERROR", error);

        return NextResponse.json(
            { error: "Archiveren mislukt" },
            { status: 500 }
        );
    }
}
