import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { linkPakbonToWorkorders } from "@/lib/documents/attachPakbon";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const guard = await requireApiRole(["admin", "office", "magazijn"]);

    if (!guard.ok) {
        return guard.response;
    }

    const { id } = await context.params;

    try {
        const body = (await request.json()) as { workorderIds?: unknown };
        const idsRaw = Array.isArray(body.workorderIds)
            ? body.workorderIds.filter((value): value is string =>
                  typeof value === "string" && value.trim().length > 0
              )
            : [];
        const workorderIds = [...new Set(idsRaw)];

        if (workorderIds.length === 0) {
            return NextResponse.json(
                { error: "Selecteer minstens één klus" },
                { status: 400 }
            );
        }

        const pakbon = await prisma.pakbon.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!pakbon) {
            return NextResponse.json(
                { error: "Pakbon niet gevonden" },
                { status: 404 }
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

        await linkPakbonToWorkorders(id, workorderIds);

        return NextResponse.json({
            success: true,
            pakbonId: id,
            workorderIds,
            count: workorderIds.length,
        });
    } catch (error) {
        console.error("PAKBON KOPPELEN ERROR", error);

        return NextResponse.json(
            { error: "Pakbon koppelen mislukt" },
            { status: 500 }
        );
    }
}
