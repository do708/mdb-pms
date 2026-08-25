import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { isBunniConfigured } from "@/lib/bunni/client";
import { resolveBunniLinkPatch } from "@/lib/bunni/link";

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    if (!isBunniConfigured()) {
        return NextResponse.json(
            { error: "Bunni API-key ontbreekt" },
            { status: 503 }
        );
    }

    try {
        const { id } = await context.params;
        const body = await request.json();
        const data = await resolveBunniLinkPatch(body);

        if (Object.keys(data).length === 0) {
            return NextResponse.json(
                { error: "Geen Bunni-koppeling opgegeven" },
                { status: 400 }
            );
        }

        const existing = await prisma.workorder.findUnique({
            where: { id },
            select: { id: true, projectId: true },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Opdracht niet gevonden" },
                { status: 404 }
            );
        }

        const workorder = await prisma.workorder.update({
            where: { id },
            data,
            include: {
                customer: true,
                project: {
                    include: { customer: true },
                },
            },
        });

        if (existing.projectId) {
            await prisma.project.update({
                where: { id: existing.projectId },
                data,
            });
        }

        return NextResponse.json(workorder);
    } catch (error) {
        console.error("WORKORDER BUNNI PATCH ERROR", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Koppelen mislukt",
            },
            { status: 500 }
        );
    }
}
