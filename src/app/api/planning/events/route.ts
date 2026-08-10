import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import {
    alignDateToWeekday,
    nthWeekdayInMonth,
    parseRecurrenceBody,
} from "@/lib/planning/expandPlanningEvents";

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

export async function POST(req: Request) {
    try {
        const guard = await requireApiRole(["admin", "office"]);
        if (!guard.ok) return guard.response;

        const body = await req.json();
        const title =
            typeof body.title === "string" ? body.title.trim() : "";
        if (!title) {
            return NextResponse.json(
                { error: "Titel is verplicht" },
                { status: 400 }
            );
        }

        const dateIso =
            typeof body.date === "string" ? body.date.trim() : "";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
            return NextResponse.json(
                { error: "Datum is verplicht (JJJJ-MM-DD)" },
                { status: 400 }
            );
        }

        const allDay = Boolean(body.allDay);
        const startTime =
            typeof body.startTime === "string" ? body.startTime : null;
        const endTime =
            typeof body.endTime === "string" ? body.endTime : null;
        const notes =
            typeof body.notes === "string" && body.notes.trim()
                ? body.notes.trim()
                : null;
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

        const recurrence = parseRecurrenceBody(body);
        if ("error" in recurrence) {
            return NextResponse.json(
                { error: recurrence.error },
                { status: 400 }
            );
        }

        let startAt = parseDateTime(dateIso, startTime, allDay);
        startAt = applyRecurrenceStart(startAt, recurrence);

        let endAt: Date | null = null;
        if (!allDay && endTime) {
            const rawEnd = parseDateTime(dateIso, endTime, false);
            const duration = rawEnd.getTime() - parseDateTime(dateIso, startTime, false).getTime();
            if (duration <= 0) {
                return NextResponse.json(
                    { error: "Eindtijd moet na starttijd liggen" },
                    { status: 400 }
                );
            }
            endAt = new Date(startAt.getTime() + duration);
        }

        const event = await prisma.planningEvent.create({
            data: {
                title,
                notes,
                startAt,
                endAt,
                allDay,
                assignedUserId,
                createdById: guard.user.id,
                recurrenceFreq: recurrence.recurrenceFreq,
                recurrenceInterval: recurrence.recurrenceInterval,
                recurrenceWeekday: recurrence.recurrenceWeekday,
                recurrenceNth: recurrence.recurrenceNth,
                recurrenceUntil: recurrence.recurrenceUntil,
            },
            include: {
                assignedUser: {
                    select: { id: true, name: true },
                },
                createdBy: {
                    select: { id: true, name: true },
                },
            },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("PLANNING EVENT POST ERROR", error);
        return NextResponse.json(
            { error: "Agenda-item opslaan mislukt" },
            { status: 500 }
        );
    }
}
