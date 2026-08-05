import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireApiUser } from "@/lib/auth/guard";
import {
    loadProjectDetail,
    serializeProjectDetail,
} from "@/lib/projects/serialize";

export async function POST(
    request: Request,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;
        const body = await request.json();

        if (!body.omschrijving?.trim()) {
            return NextResponse.json(
                { error: "Omschrijving is verplicht" },
                { status: 400 }
            );
        }

        const kosten = Number(body.kosten);

        if (!Number.isFinite(kosten) || kosten < 0) {
            return NextResponse.json(
                { error: "Vul geldige kosten in" },
                { status: 400 }
            );
        }

        const factuurnummer =
            typeof body.factuurnummer === "string"
                ? body.factuurnummer.trim() || null
                : null;

        const leverancier =
            typeof body.leverancier === "string"
                ? body.leverancier.trim() || null
                : null;

        let ingekochtOp: Date | null = null;

        if (body.ingekochtOp) {
            ingekochtOp = new Date(body.ingekochtOp);

            if (Number.isNaN(ingekochtOp.getTime())) {
                return NextResponse.json(
                    { error: "Ongeldige datum" },
                    { status: 400 }
                );
            }
        }

        await prisma.projectMateriaal.create({
            data: {
                projectId: id,
                omschrijving: body.omschrijving.trim(),
                factuurnummer,
                leverancier,
                kosten,
                ingekochtOp,
            },
        });

        const detail = await loadProjectDetail(id);

        return NextResponse.json(serializeProjectDetail(detail), {
            status: 201,
        });
    } catch (error) {
        console.error("PROJECT MATERIAAL POST ERROR", error);

        return NextResponse.json(
            { error: "Materiaal toevoegen mislukt" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const materiaalId = searchParams.get("materiaalId");

        if (!materiaalId) {
            return NextResponse.json(
                { error: "materiaalId ontbreekt" },
                { status: 400 }
            );
        }

        const { id } = await context.params;

        await prisma.projectMateriaal.deleteMany({
            where: {
                id: materiaalId,
                projectId: id,
            },
        });

        const detail = await loadProjectDetail(id);

        return NextResponse.json(serializeProjectDetail(detail));
    } catch (error) {
        console.error("PROJECT MATERIAAL DELETE ERROR", error);

        return NextResponse.json(
            { error: "Materiaal verwijderen mislukt" },
            { status: 500 }
        );
    }
}
