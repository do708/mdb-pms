import { prisma } from "@/lib/prisma";
import {
    addAmsterdamCalendarDays,
    amsterdamLocalToDate,
    formatAmsterdamDateIso,
} from "@/lib/datetime/amsterdam";
import { expandPlanningEvents } from "@/lib/planning/expandPlanningEvents";

export type ForgottenProjectHour = {
    id: string;
    projectId: string;
    projectNumber: string;
    projectName: string;
    customerName: string | null;
    userId: string;
    userName: string;
    dateIso: string;
};

export async function loadForgottenProjectHours(options?: {
    userId?: string;
}): Promise<ForgottenProjectHour[]> {
    const todayIso = formatAmsterdamDateIso(new Date());
    const rangeStart = addAmsterdamCalendarDays(
        amsterdamLocalToDate(todayIso, "00:00"),
        -21
    );
    const rangeEnd = amsterdamLocalToDate(todayIso, "23:59");

    const masters = await prisma.planningEvent.findMany({
        where: {
            projectId: { not: null },
            assignedUserId: options?.userId
                ? options.userId
                : { not: null },
        },
        include: {
            assignedUser: {
                select: { id: true, name: true, email: true },
            },
            project: {
                select: {
                    id: true,
                    number: true,
                    name: true,
                    status: true,
                    customer: { select: { name: true } },
                },
            },
        },
    });

    const events = expandPlanningEvents(masters, rangeStart, rangeEnd);

    const hours = await prisma.projectUur.findMany({
        where: {
            datum: { gte: rangeStart, lte: rangeEnd },
            ...(options?.userId ? { userId: options.userId } : {}),
        },
        select: {
            projectId: true,
            userId: true,
            datum: true,
        },
    });

    const booked = new Set(
        hours.map(
            (row) =>
                `${row.projectId}|${row.userId}|${formatAmsterdamDateIso(row.datum)}`
        )
    );

    const seen = new Set<string>();
    const missing: ForgottenProjectHour[] = [];

    for (const ev of events) {
        const project = (
            ev as typeof ev & {
                project?: {
                    id: string;
                    number: string;
                    name: string;
                    status: string;
                    customer?: { name: string } | null;
                } | null;
            }
        ).project;
        if (!project || !ev.assignedUserId) {
            continue;
        }
        if (project.status === "afgerond") {
            continue;
        }

        const dateIso =
            ev.occurrenceDate ||
            formatAmsterdamDateIso(new Date(ev.startAt));
        if (dateIso > todayIso) {
            continue;
        }

        const key = `${project.id}|${ev.assignedUserId}|${dateIso}`;
        if (seen.has(key) || booked.has(key)) {
            continue;
        }
        seen.add(key);

        missing.push({
            id: key,
            projectId: project.id,
            projectNumber: project.number,
            projectName: project.name,
            customerName: project.customer?.name ?? null,
            userId: ev.assignedUserId,
            userName:
                ev.assignedUser?.name?.trim() ||
                ev.assignedUser?.email ||
                "Monteur",
            dateIso,
        });
    }

    missing.sort((a, b) =>
        a.dateIso === b.dateIso
            ? a.userName.localeCompare(b.userName, "nl")
            : a.dateIso.localeCompare(b.dateIso)
    );

    return missing;
}
