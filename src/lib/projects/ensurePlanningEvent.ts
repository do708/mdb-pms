import { prisma } from "@/lib/prisma";
import {
    amsterdamLocalToDate,
    addAmsterdamCalendarDays,
} from "@/lib/datetime/amsterdam";

export const PROJECT_PLAN_START = "08:00";
export const PROJECT_PLAN_END = "16:00";

export async function ensureProjectPlanningEvent(args: {
    projectId: string;
    projectNumber: string;
    projectName: string;
    userId: string;
    dateIso: string;
    createdById: string;
    startTime?: string;
    endTime?: string;
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

    const startTime = args.startTime || PROJECT_PLAN_START;
    const endTime = args.endTime || PROJECT_PLAN_END;

    await prisma.planningEvent.create({
        data: {
            title: `${args.projectNumber} · ${args.projectName}`,
            notes: "Project",
            startAt: amsterdamLocalToDate(args.dateIso, startTime),
            endAt: amsterdamLocalToDate(args.dateIso, endTime),
            allDay: false,
            assignedUserId: args.userId,
            projectId: args.projectId,
            createdById: args.createdById,
        },
    });
}
