import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import {
    amsterdamLocalToDate,
    getAmsterdamParts,
} from "@/lib/datetime/amsterdam";
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
        const p = getAmsterdamParts(startAt);
        const aligned =
            nthWeekdayInMonth(
                p.year,
                p.month - 1,
                recurrence.recurrenceWeekday,
                recurrence.recurrenceNth,
                startAt
            ) ||
            nthWeekdayInMonth(
                p.month === 12 ? p.year + 1 : p.year,
                p.month === 12 ? 0 : p.month,
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

        if (!guard.user.id) {
            return NextResponse.json(
                { error: "Sessie ongeldig — log opnieuw in" },
                { status: 401 }
            );
        }

        const recurrence = parseRecurrenceBody(body);
        if ("error" in recurrence) {
            return NextResponse.json(
                { error: recurrence.error },
                { status: 400 }
            );
        }

        let startAt = parseDateTime(dateIso, startTime, allDay);
        if (Number.isNaN(startAt.getTime())) {
            return NextResponse.json(
                { error: "Ongeldige datum" },
                { status: 400 }
            );
        }
        startAt = applyRecurrenceStart(startAt, recurrence);

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
        const message =
            error &&
            typeof error === "object" &&
            "message" in error &&
            typeof (error as { message: unknown }).message === "string"
                ? (error as { message: string }).message
                : "";
        const hint =
            /column .* does not exist|Unknown argument/i.test(message)
                ? "Database mist nieuwe velden — voer migraties uit (prisma migrate deploy)."
                : /Foreign key|P2003/i.test(message)
                  ? "Gebruiker of monteur niet gevonden — log opnieuw in."
                  : null;
        return NextResponse.json(
            {
                error: hint || "Agenda-item opslaan mislukt",
                detail:
                    process.env.NODE_ENV !== "production" && message
                        ? message.slice(0, 400)
                        : undefined,
            },
            { status: 500 }
        );
    }
}
