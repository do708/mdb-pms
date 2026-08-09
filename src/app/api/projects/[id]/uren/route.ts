import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireApiUser } from "@/lib/auth/guard";
import { projectIsActive } from "@/lib/projects/budget";
import {
    loadProjectDetail,
    serializeProjectDetail,
} from "@/lib/projects/serialize";
import { parseHoursInput } from "@/lib/hours";

export async function GET(
    request: Request,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    const guard = await requireApiUser();

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;

        const project = await prisma.project.findUnique({
            where: { id },
            select: { status: true },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project niet gevonden" },
                { status: 404 }
            );
        }

        if (
            guard.user.role === "engineer" &&
            !projectIsActive(project.status)
        ) {
            return NextResponse.json(
                { error: "Geen toegang" },
                { status: 403 }
            );
        }

        const rows = await prisma.projectUur.findMany({
            where: { projectId: id },
            orderBy: [{ datum: "desc" }, { createdAt: "desc" }],
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                bookedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(rows);
    } catch (error) {
        console.error("PROJECT UREN GET ERROR", error);

        return NextResponse.json(
            { error: "Uren ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    const guard = await requireApiUser();

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;
        const body = await request.json();

        const project = await prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project niet gevonden" },
                { status: 404 }
            );
        }

        if (!projectIsActive(project.status)) {
            return NextResponse.json(
                { error: "Dit project is niet meer actief" },
                { status: 400 }
            );
        }

        // Intern altijd decimale uren (1.5), nooit klok 1.30 optellen
        const uren = parseHoursInput(body.uren);

        if (!Number.isFinite(uren) || uren <= 0 || uren > 24) {
            return NextResponse.json(
                {
                    error: "Vul een geldig aantal uren in (bijv. 1.30 of 1,5)",
                },
                { status: 400 }
            );
        }

        if (!body.datum) {
            return NextResponse.json(
                { error: "Datum is verplicht" },
                { status: 400 }
            );
        }

        const datum = new Date(body.datum);

        if (Number.isNaN(datum.getTime())) {
            return NextResponse.json(
                { error: "Ongeldige datum" },
                { status: 400 }
            );
        }

        const omschrijving =
            typeof body.omschrijving === "string"
                ? body.omschrijving.trim() || null
                : null;

        const rawIds: unknown[] = Array.isArray(body.userIds)
            ? body.userIds
            : body.userId
              ? [body.userId]
              : guard.user.role === "engineer"
                ? [guard.user.id]
                : [];

        const userIds: string[] = [
            ...new Set(
                rawIds.filter(
                    (uid): uid is string =>
                        typeof uid === "string" && uid.length > 0
                )
            ),
        ];

        if (userIds.length === 0) {
            return NextResponse.json(
                { error: "Selecteer minimaal één monteur" },
                { status: 400 }
            );
        }

        const engineers = await prisma.user.findMany({
            where: {
                id: { in: userIds },
                role: "engineer",
                active: true,
            },
            select: { id: true },
        });

        if (engineers.length !== userIds.length) {
            return NextResponse.json(
                { error: "Ongeldige monteur(s) geselecteerd" },
                { status: 400 }
            );
        }

        await prisma.$transaction(
            userIds.map((userId) =>
                prisma.projectUur.create({
                    data: {
                        projectId: id,
                        userId,
                        bookedByUserId: guard.user.id,
                        datum,
                        uren,
                        omschrijving,
                    },
                })
            )
        );

        const detail = await loadProjectDetail(id);

        return NextResponse.json(
            serializeProjectDetail(detail, {
                forEngineer: guard.user.role === "engineer",
            }),
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error("PROJECT UREN POST ERROR", error);

        return NextResponse.json(
            { error: "Uren boeken mislukt" },
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
        const urenId = searchParams.get("urenId");

        if (!urenId) {
            return NextResponse.json(
                { error: "urenId ontbreekt" },
                { status: 400 }
            );
        }

        const { id } = await context.params;

        await prisma.projectUur.deleteMany({
            where: {
                id: urenId,
                projectId: id,
            },
        });

        const detail = await loadProjectDetail(id);

        return NextResponse.json(serializeProjectDetail(detail));
    } catch (error) {
        console.error("PROJECT UREN DELETE ERROR", error);

        return NextResponse.json(
            { error: "Urenregel verwijderen mislukt" },
            { status: 500 }
        );
    }
}
