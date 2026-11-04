import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { contentTypeForFilename } from "@/lib/attachments/contentType";
import { attachPakbonUrlToWorkorder } from "@/lib/documents/attachPakbon";
import { uploadPakbonToNas } from "@/lib/documents/pakbonStorage";
import { isNasConfigured } from "@/lib/nas/synologyConfig";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
    const guard = await requireApiRole(["admin", "office", "magazijn"]);

    if (!guard.ok) {
        return guard.response;
    }

    const workorders = await prisma.workorder.findMany({
        where: {
            NOT: { status: { in: ["gefactureerd"] } },
        },
        orderBy: [{ plannedDate: "asc" }, { number: "desc" }],
        take: 250,
        select: {
            id: true,
            number: true,
            title: true,
            status: true,
            plannedDate: true,
            city: true,
            customer: { select: { name: true } },
            assignedUser: { select: { name: true } },
        },
    });

    return NextResponse.json({ workorders });
}

export async function POST(request: NextRequest) {
    const guard = await requireApiRole(["admin", "office", "magazijn"]);

    if (!guard.ok) {
        return guard.response;
    }

    if (!isNasConfigured()) {
        return NextResponse.json(
            {
                error:
                    "NAS is niet ingesteld. Pakbonnen horen op de NAS, niet in Supabase.",
            },
            { status: 503 }
        );
    }

    try {
        const form = await request.formData();
        const file = form.get("file");
        const idsRaw = form.getAll("workorderIds").flatMap((value) =>
            typeof value === "string"
                ? value.split(",").map((part) => part.trim()).filter(Boolean)
                : []
        );

        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json(
                { error: "Geen pakbon ontvangen" },
                { status: 400 }
            );
        }

        const workorderIds = [...new Set(idsRaw)];

        if (workorderIds.length === 0) {
            return NextResponse.json(
                { error: "Selecteer minstens één klus" },
                { status: 400 }
            );
        }

        const found = await prisma.workorder.findMany({
            where: { id: { in: workorderIds } },
            select: { id: true },
        });

        if (found.length !== workorderIds.length) {
            return NextResponse.json(
                { error: "Een of meer klussen zijn niet gevonden" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadPakbonToNas(
            "gedeeld",
            file.name,
            buffer,
            file.type || contentTypeForFilename(file.name)
        );

        for (const id of workorderIds) {
            await attachPakbonUrlToWorkorder(id, url);
        }

        return NextResponse.json({
            success: true,
            url,
            workorderIds,
            count: workorderIds.length,
        });
    } catch (error) {
        console.error("PAKBONNEN UPLOAD ERROR", error);

        return NextResponse.json(
            { error: "Pakbon uploaden mislukt" },
            { status: 500 }
        );
    }
}
