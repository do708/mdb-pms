import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { amsterdamLocalToDate, formatAmsterdamDateIso, formatAmsterdamHHmm } from "@/lib/datetime/amsterdam";
import {
    alignDateToWeekday,
    nthWeekdayInMonth,
    parseMasterId,
    parseRecurrenceBody,
} from "@/lib/planning/expandPlanningEvents";

function parseDateTime(
    dateIso: string,
    time: string | null | undefined,
    allDay: boolean
): Date {
    if (allDay || !time) {
        return amsterdamLocalToDate(dateIso, "00:00");
    }
    return amsterdamLocalToDate(dateIso, time);
}

function applyRecurrenceStart(
    startAt: Date,
    recurrence: {
        recurrenceFreq: string;
        recurrenceWeekday: number | null;
        recurrenceNth: number | null;
    }
): Date {
    if (
        recurrence.recurrenceFreq === "weekly" &&
        recurrence.recurrenceWeekday != null
    ) {
        return alignDateToWeekday(startAt, recurrence.recurrenceWeekday);
    }
    if (
        recurrence.recurrenceFreq === "monthly_weekday" &&
        recurrence.recurrenceWeekday != null &&
        recurrence.recurrenceNth != null
    ) {
        const aligned =
            nthWeekdayInMonth(
                startAt.getFullYear(),
                startAt.getMonth(),
                recurrence.recurrenceWeekday,
                recurrence.recurrenceNth,
                startAt
            ) ||
            nthWeekdayInMonth(
                startAt.getFullYear(),
                startAt.getMonth() + 1,
                recurrence.recurrenceWeekday,
                recurrence.recurrenceNth,
                startAt
            );
        return aligned || startAt;
    }
    return startAt;
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guard = await requireApiRole(["admin", "office"]);
        if (!guard.ok) return guard.response;

        const { id: rawId } = await params;
        const id = parseMasterId(rawId);
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
            recurrenceFreq?: string;
            recurrenceInterval?: number;
            recurrenceWeekday?: number | null;
            recurrenceNth?: number | null;
            recurrenceUntil?: Date | null;
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

        let recurrenceForAlign: {
            recurrenceFreq: string;
            recurrenceWeekday: number | null;
            recurrenceNth: number | null;
        } | null = null;

        if (
            "recurrenceFreq" in body ||
            "recurrenceInterval" in body ||
            "recurrenceUntil" in body ||
            "recurrenceWeekday" in body ||
            "recurrenceNth" in body
        ) {
            const recurrence = parseRecurrenceBody(body);
            if ("error" in recurrence) {
                return NextResponse.json(
                    { error: recurrence.error },
                    { status: 400 }
                );
            }
            data.recurrenceFreq = recurrence.recurrenceFreq;
            data.recurrenceInterval = recurrence.recurrenceInterval;
            data.recurrenceWeekday = recurrence.recurrenceWeekday;
            data.recurrenceNth = recurrence.recurrenceNth;
            data.recurrenceUntil = recurrence.recurrenceUntil;
            recurrenceForAlign = recurrence;
        }

        const hasSchedule =
            typeof body.date === "string" ||
            "startTime" in body ||
            "endTime" in body ||
            "allDay" in body ||
            recurrenceForAlign != null;

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
                dateIso = formatAmsterdamDateIso(current.startAt);
            }

            const startTime =
                "startTime" in body
                    ? typeof body.startTime === "string"
                        ? body.startTime
                        : null
                    : allDay
                      ? null
                      : formatAmsterdamHHmm(current.startAt);

            const endTime =
                "endTime" in body
                    ? typeof body.endTime === "string"
                        ? body.endTime
                        : null
                    : allDay || !current.endAt
                      ? null
                      : formatAmsterdamHHmm(current.endAt);

            let startAt = parseDateTime(dateIso, startTime, allDay);
            // Alleen herhaling uitlijnen als de datum niet expliciet is gezet
            // (anders blokkeert drag-and-drop naar een andere dag/tijd).
            const dateExplicit =
                typeof body.date === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(body.date.trim());
            if (!dateExplicit) {
                const align =
                    recurrenceForAlign ||
                    ({
                        recurrenceFreq: current.recurrenceFreq,
                        recurrenceWeekday: current.recurrenceWeekday,
                        recurrenceNth: current.recurrenceNth,
                    } as const);
                startAt = applyRecurrenceStart(startAt, align);
            } else if (recurrenceForAlign) {
                startAt = applyRecurrenceStart(startAt, recurrenceForAlign);
            }

            let endAt: Date | null = null;
            if (!allDay && endTime) {
                const rawEnd = parseDateTime(dateIso, endTime, false);
                const rawStart = parseDateTime(dateIso, startTime, false);
                const duration = rawEnd.getTime() - rawStart.getTime();
                if (duration <= 0) {
                    return NextResponse.json(
                        { error: "Eindtijd moet na starttijd liggen" },
                        { status: 400 }
                    );
                }
                endAt = new Date(startAt.getTime() + duration);
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

        const { id: rawId } = await params;
        const id = parseMasterId(rawId);
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
