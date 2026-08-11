import { prisma } from "@/lib/prisma";
import { formatAmsterdamDateIso } from "@/lib/datetime/amsterdam";
import {
    defaultPlanningEventRange,
    expandPlanningEvents,
} from "@/lib/planning/expandPlanningEvents";
import {
    detectPlanningConflicts,
    type PlanningConflict,
} from "@/lib/planning/detectConflicts";

/**
 * Planningsconflicten vanaf vandaag (zelfde venster als agenda-expansie).
 * Voor kantoormeldingen / bel — niet gefilterd op monteur.
 */
export async function loadUpcomingPlanningConflicts(): Promise<
    PlanningConflict[]
> {
    const { rangeStart, rangeEnd } = defaultPlanningEventRange();

    const [workorders, eventMasters] = await Promise.all([
        prisma.workorder.findMany({
            where: {
                plannedDate: {
                    gte: rangeStart,
                    lte: rangeEnd,
                },
                assignedUserId: { not: null },
                status: { notIn: ["gefactureerd"] },
            },
            select: {
                id: true,
                number: true,
                title: true,
                plannedDate: true,
                plannedEndDate: true,
                assignedUserId: true,
                assignedUser: { select: { name: true } },
            },
        }),
        prisma.planningEvent.findMany({
            where: { assignedUserId: { not: null } },
            include: {
                assignedUser: {
                    select: { id: true, name: true },
                },
            },
        }),
    ]);

    const events = expandPlanningEvents(
        eventMasters,
        rangeStart,
        rangeEnd
    );

    const vandaagIso = formatAmsterdamDateIso(new Date());

    return detectPlanningConflicts(workorders, events).filter(
        (c) => c.dateIso >= vandaagIso
    );
}
