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

        const projectId =
            typeof body.projectId === "string" && body.projectId.trim()
                ? body.projectId.trim()
                : null;

        let linkedProject: {
            id: string;
            number: string;
            name: string;
        } | null = null;
        if (projectId) {
            linkedProject = await prisma.project.findUnique({
                where: { id: projectId },
                select: { id: true, number: true, name: true },
            });
            if (!linkedProject) {
                return NextResponse.json(
                    { error: "Project niet gevonden" },
                    { status: 400 }
                );
            }
        }

        const title =
            typeof body.title === "string" && body.title.trim()
                ? body.title.trim()
                : linkedProject
                  ? `${linkedProject.number} · ${linkedProject.name}`
                  : "";
        if (!title) {
            return NextResponse.json(
                { error: "Titel is verplicht" },
                { status: 400 }
            );
        }

        const dateSet = new Set<string>();
        const pushDate = (value: unknown) => {
            if (
                typeof value === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
            ) {
                dateSet.add(value.trim());
            }
        };
        pushDate(body.date);
        if (Array.isArray(body.dates)) {
            for (const d of body.dates) pushDate(d);
        }
        const dates = [...dateSet].sort();
        if (dates.length === 0) {
            return NextResponse.json(
                { error: "Datum is verplicht (JJJJ-MM-DD)" },
                { status: 400 }
            );
        }
        if (dates.length > 21) {
            return NextResponse.json(
                { error: "Kies maximaal 21 dagen tegelijk" },
                { status: 400 }
            );
        }

        const isProject = Boolean(linkedProject);
        const allDay = isProject ? false : Boolean(body.allDay);
        const startTime =
            typeof body.startTime === "string" && body.startTime.trim()
                ? body.startTime.trim()
                : isProject
                  ? "08:00"
                  : null;
        const endTime =
            typeof body.endTime === "string" && body.endTime.trim()
                ? body.endTime.trim()
                : isProject
                  ? "16:00"
                  : null;
        const notes =
            typeof body.notes === "string" && body.notes.trim()
                ? body.notes.trim()
                : isProject
                  ? "Project"
                  : null;

        const userIdSet = new Set<string>();
        if (Array.isArray(body.userIds)) {
            for (const uid of body.userIds) {
                if (typeof uid === "string" && uid.trim()) {
                    userIdSet.add(uid.trim());
                }
            }
        }
        if (
            typeof body.assignedUserId === "string" &&
            body.assignedUserId.trim()
        ) {
            userIdSet.add(body.assignedUserId.trim());
        }
        const userIds = [...userIdSet];

        if (isProject && userIds.length === 0) {
            return NextResponse.json(
                { error: "Selecteer minimaal één monteur" },
                { status: 400 }
            );
        }

        if (userIds.length > 0) {
            const engineers = await prisma.user.findMany({
                where: {
                    id: { in: userIds },
                    role: "engineer",
                },
                select: { id: true },
            });
            if (engineers.length !== userIds.length) {
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

        const recurrence = parseRecurrenceBody(
            dates.length > 1 || isProject
                ? { ...body, recurrenceFreq: "none" }
                : body
        );
        if ("error" in recurrence) {
            return NextResponse.json(
                { error: recurrence.error },
                { status: 400 }
            );
        }

        const assignees: (string | null)[] =
            userIds.length > 0 ? userIds : [null];

        const created = [];
        for (const dateIso of dates) {
            let startAt = parseDateTime(dateIso, startTime, allDay);
            if (Number.isNaN(startAt.getTime())) {
                return NextResponse.json(
                    { error: "Ongeldige datum" },
                    { status: 400 }
                );
            }
            if (dates.length === 1) {
                startAt = applyRecurrenceStart(startAt, recurrence);
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

            for (const assignedUserId of assignees) {
                const event = await prisma.planningEvent.create({
                    data: {
                        title,
                        notes,
                        startAt,
                        endAt,
                        allDay,
                        assignedUserId,
                        projectId,
                        createdById: guard.user.id,
                        recurrenceFreq:
                            dates.length > 1 || isProject
                                ? "none"
                                : recurrence.recurrenceFreq,
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
                created.push(event);
            }
        }

        if (created.length === 1) {
            return NextResponse.json(created[0], { status: 201 });
        }

        return NextResponse.json(
            { count: created.length, events: created },
            { status: 201 }
        );
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
