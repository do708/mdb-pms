import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireApiUser } from "@/lib/auth/guard";
import { projectIsActive } from "@/lib/projects/budget";
import { toIsoDay } from "@/constants/staffKind";
import { ensureProjectPlanningEvent } from "@/lib/projects/ensurePlanningEvent";
import { formatAmsterdamDateIso } from "@/lib/datetime/amsterdam";

export async function GET(
    _request: Request,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    const guard = await requireApiUser();
    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;
        const events = await prisma.planningEvent.findMany({
            where: { projectId: id },
            orderBy: { startAt: "asc" },
            include: {
                assignedUser: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json(
            events.map((ev) => ({
                id: ev.id,
                startAt: ev.startAt,
                dateIso: formatAmsterdamDateIso(ev.startAt),
                assignedUserId: ev.assignedUserId,
                assignedUser: ev.assignedUser,
                title: ev.title,
            }))
        );
    } catch (error) {
        console.error("PROJECT PLANNING GET ERROR", error);
        return NextResponse.json(
            { error: "Planning ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    const guard = await requireApiRole(["admin", "office"]);
    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;
        const body = await request.json();
        const project = await prisma.project.findUnique({
            where: { id },
            select: { id: true, number: true, name: true, status: true },
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

        const dateIso =
            toIsoDay(typeof body.datum === "string" ? body.datum : "") || "";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
            return NextResponse.json(
                { error: "Datum is verplicht" },
                { status: 400 }
            );
        }

        const rawIds: unknown[] = Array.isArray(body.userIds)
            ? body.userIds
            : [];
        const userIds = [
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

        if (!guard.user.id) {
            return NextResponse.json(
                { error: "Sessie ongeldig" },
                { status: 401 }
            );
        }

        await Promise.all(
            userIds.map((userId) =>
                ensureProjectPlanningEvent({
                    projectId: project.id,
                    projectNumber: project.number,
                    projectName: project.name,
                    userId,
                    dateIso,
                    createdById: guard.user.id,
                })
            )
        );

        const events = await prisma.planningEvent.findMany({
            where: { projectId: id },
            orderBy: { startAt: "asc" },
            include: {
                assignedUser: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json(
            events.map((ev) => ({
                id: ev.id,
                startAt: ev.startAt,
                dateIso: formatAmsterdamDateIso(ev.startAt),
                assignedUserId: ev.assignedUserId,
                assignedUser: ev.assignedUser,
                title: ev.title,
            })),
            { status: 201 }
        );
    } catch (error) {
        console.error("PROJECT PLANNING POST ERROR", error);
        return NextResponse.json(
            { error: "Op planning zetten mislukt" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    const guard = await requireApiRole(["admin", "office"]);
    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");
        if (!eventId) {
            return NextResponse.json(
                { error: "eventId ontbreekt" },
                { status: 400 }
            );
        }

        await prisma.planningEvent.deleteMany({
            where: { id: eventId, projectId: id },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("PROJECT PLANNING DELETE ERROR", error);
        return NextResponse.json(
            { error: "Planningregel verwijderen mislukt" },
            { status: 500 }
        );
    }
}
