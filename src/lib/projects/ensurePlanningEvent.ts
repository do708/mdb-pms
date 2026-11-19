import { prisma } from "@/lib/prisma";
import {
    amsterdamLocalToDate,
    addAmsterdamCalendarDays,
} from "@/lib/datetime/amsterdam";

export async function ensureProjectPlanningEvent(args: {
    projectId: string;
    projectNumber: string;
    projectName: string;
    userId: string;
    dateIso: string;
    createdById: string;
}): Promise<void> {
    const dayStart = amsterdamLocalToDate(args.dateIso, "00:00");
    const nextDay = addAmsterdamCalendarDays(dayStart, 1);

    const existing = await prisma.planningEvent.findFirst({
        where: {
            projectId: args.projectId,
            assignedUserId: args.userId,
            startAt: { gte: dayStart, lt: nextDay },
        },
        select: { id: true },
    });

    if (existing) {
        return;
    }

    await prisma.planningEvent.create({
        data: {
            title: `${args.projectNumber} · ${args.projectName}`,
            notes: "Project",
            startAt: dayStart,
            endAt: null,
            allDay: true,
            assignedUserId: args.userId,
            projectId: args.projectId,
            createdById: args.createdById,
        },
    });
}
