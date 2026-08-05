import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { requireApiUser } from "@/lib/auth/guard";
import {
    loadProjectDetail,
    serializeProjectDetail,
} from "@/lib/projects/serialize";
import { syncEngineerDayKilometers } from "@/lib/travel/syncEngineerDayKilometers";

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

        const project = await loadProjectDetail(id);

        if (!project) {
            return NextResponse.json(
                { error: "Project niet gevonden" },
                { status: 404 }
            );
        }

        if (guard.user.role === "engineer") {
            const allowed =
                project.status === "actief" || project.status === "new";

            if (!allowed) {
                return NextResponse.json(
                    { error: "Geen toegang" },
                    { status: 403 }
                );
            }
        }

        // Km blijven zoals bij boeken opgeslagen — geen herberekening bij openen
        return NextResponse.json(
            serializeProjectDetail(project, {
                forEngineer: guard.user.role === "engineer",
            })
        );
    } catch (error) {
        console.error("PROJECT GET ERROR", error);

        return NextResponse.json(
            { error: "Project ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function PATCH(
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

        const data: Record<string, unknown> = {};

        if (body.name != null) {
            data.name = body.name;
        }

        if (body.location !== undefined) {
            data.location = body.location || null;
        }

        if (body.plaats !== undefined) {
            data.plaats = body.plaats || null;
        }

        if (body.customerId != null) {
            data.customerId = body.customerId;
        }

        if (body.status != null) {
            data.status = body.status;
        }

        if (body.geoffreerdeUren !== undefined) {
            data.geoffreerdeUren =
                body.geoffreerdeUren === "" || body.geoffreerdeUren == null
                    ? null
                    : body.geoffreerdeUren;
        }

        if (body.geoffreerdBedrag !== undefined) {
            data.geoffreerdBedrag =
                body.geoffreerdBedrag === "" || body.geoffreerdBedrag == null
                    ? null
                    : body.geoffreerdBedrag;
        }

        if (body.offerteUrl !== undefined) {
            data.offerteUrl = body.offerteUrl || null;
        }

        if (body.offerteFilename !== undefined) {
            data.offerteFilename = body.offerteFilename || null;
        }

        const existing = await prisma.project.findUnique({
            where: { id },
            select: { location: true, plaats: true },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Project niet gevonden" },
                { status: 404 }
            );
        }

        const locationChanged =
            (body.location !== undefined &&
                (body.location || null) !== existing.location) ||
            (body.plaats !== undefined &&
                (body.plaats || null) !== existing.plaats);

        await prisma.project.update({
            where: { id },
            data,
        });

        // Adres gewijzigd → km herberekeken en opnieuw opslaan (niet stil bij GET)
        if (locationChanged) {
            const uren = await prisma.projectUur.findMany({
                where: { projectId: id },
                select: { userId: true, datum: true },
            });

            const synced = new Set<string>();

            for (const row of uren) {
                const key = `${row.userId}:${row.datum.toISOString().slice(0, 10)}`;
                if (synced.has(key)) continue;
                synced.add(key);
                await syncEngineerDayKilometers(row.userId, row.datum);
            }
        }

        const project = await loadProjectDetail(id);

        return NextResponse.json(serializeProjectDetail(project));
    } catch (error) {
        console.error("PROJECT PATCH ERROR", error);

        return NextResponse.json(
            { error: "Project bijwerken mislukt" },
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
        const { id } = await context.params;

        const workorders = await prisma.workorder.count({
            where: {
                projectId: id,
            },
        });

        if (workorders > 0) {
            return NextResponse.json(
                {
                    error: `Dit project heeft nog ${workorders} werkbon(nen). Verwijder of ontkoppel die eerst.`,
                },
                {
                    status: 400,
                }
            );
        }

        await prisma.project.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({
            success: true,
            deleted: true,
        });
    } catch (error) {
        console.error("PROJECT DELETE ERROR", error);

        return NextResponse.json(
            {
                error: "Project verwijderen mislukt",
            },
            {
                status: 500,
            }
        );
    }
}
