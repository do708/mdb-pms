import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";

function parseDateTime(
    dateIso: string,
    time: string | null | undefined,
    allDay: boolean
): Date {
    if (allDay || !time) {
        const [y, m, d] = dateIso.split("-").map(Number);
        return new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    const [hh, mm] = time.split(":").map(Number);
    const [y, m, d] = dateIso.split("-").map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guard = await requireApiRole(["admin", "office"]);
        if (!guard.ok) return guard.response;

        const { id } = await params;
        const existing = await prisma.planningEvent.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existing) {
            return NextResponse.json(
                { error: "Agenda-item niet gevonden" },
                { status: 404 }
            );
        }

        const body = await req.json();
        const data: {
            title?: string;
            notes?: string | null;
            startAt?: Date;
            endAt?: Date | null;
            allDay?: boolean;
            assignedUserId?: string | null;
        } = {};

        if (typeof body.title === "string") {
            const title = body.title.trim();
            if (!title) {
                return NextResponse.json(
                    { error: "Titel is verplicht" },
                    { status: 400 }
                );
            }
            data.title = title;
        }

        if ("notes" in body) {
            data.notes =
                typeof body.notes === "string" && body.notes.trim()
                    ? body.notes.trim()
                    : null;
        }

        if ("assignedUserId" in body) {
            const assignedUserId =
                typeof body.assignedUserId === "string" &&
                body.assignedUserId.trim()
                    ? body.assignedUserId.trim()
                    : null;
            if (assignedUserId) {
                const engineer = await prisma.user.findFirst({
                    where: {
                        id: assignedUserId,
                        role: "engineer",
                        active: true,
                    },
                    select: { id: true },
                });
                if (!engineer) {
                    return NextResponse.json(
                        { error: "Monteur niet gevonden" },
                        { status: 400 }
                    );
                }
            }
            data.assignedUserId = assignedUserId;
        }

        const hasSchedule =
            typeof body.date === "string" ||
            "startTime" in body ||
            "endTime" in body ||
            "allDay" in body;

        if (hasSchedule) {
            const current = await prisma.planningEvent.findUnique({
                where: { id },
            });
            if (!current) {
                return NextResponse.json(
                    { error: "Agenda-item niet gevonden" },
                    { status: 404 }
                );
            }

            const allDay =
                "allDay" in body ? Boolean(body.allDay) : current.allDay;

            let dateIso: string;
            if (
                typeof body.date === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(body.date.trim())
            ) {
                dateIso = body.date.trim();
            } else {
                const d = current.startAt;
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                dateIso = `${y}-${m}-${day}`;
            }

            const startTime =
                "startTime" in body
                    ? typeof body.startTime === "string"
                        ? body.startTime
                        : null
                    : allDay
                      ? null
                      : `${String(current.startAt.getHours()).padStart(2, "0")}:${String(current.startAt.getMinutes()).padStart(2, "0")}`;

            const endTime =
                "endTime" in body
                    ? typeof body.endTime === "string"
                        ? body.endTime
                        : null
                    : allDay || !current.endAt
                      ? null
                      : `${String(current.endAt.getHours()).padStart(2, "0")}:${String(current.endAt.getMinutes()).padStart(2, "0")}`;

            const startAt = parseDateTime(dateIso, startTime, allDay);
            let endAt: Date | null = null;
            if (!allDay && endTime) {
                endAt = parseDateTime(dateIso, endTime, false);
                if (endAt.getTime() <= startAt.getTime()) {
                    return NextResponse.json(
                        { error: "Eindtijd moet na starttijd liggen" },
                        { status: 400 }
                    );
                }
            }

            data.allDay = allDay;
            data.startAt = startAt;
            data.endAt = endAt;
        }

        const event = await prisma.planningEvent.update({
            where: { id },
            data,
            include: {
                assignedUser: {
                    select: { id: true, name: true },
                },
                createdBy: {
                    select: { id: true, name: true },
                },
            },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("PLANNING EVENT PATCH ERROR", error);
        return NextResponse.json(
            { error: "Agenda-item bijwerken mislukt" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guard = await requireApiRole(["admin", "office"]);
        if (!guard.ok) return guard.response;

        const { id } = await params;
        const existing = await prisma.planningEvent.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existing) {
            return NextResponse.json(
                { error: "Agenda-item niet gevonden" },
                { status: 404 }
            );
        }

        await prisma.planningEvent.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("PLANNING EVENT DELETE ERROR", error);
        return NextResponse.json(
            { error: "Agenda-item verwijderen mislukt" },
            { status: 500 }
        );
    }
}
