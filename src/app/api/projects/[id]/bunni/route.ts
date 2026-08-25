import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { isBunniConfigured } from "@/lib/bunni/client";
import { resolveBunniLinkPatch } from "@/lib/bunni/link";
import {
    loadProjectDetail,
    serializeProjectDetail,
} from "@/lib/projects/serialize";

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

        const existing = await prisma.project.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Project niet gevonden" },
                { status: 404 }
            );
        }

        await prisma.project.update({
            where: { id },
            data,
        });

        const project = await loadProjectDetail(id);
        return NextResponse.json(serializeProjectDetail(project));
    } catch (error) {
        console.error("PROJECT BUNNI PATCH ERROR", error);

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
