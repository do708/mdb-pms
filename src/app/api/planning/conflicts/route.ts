import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/guard";
import {
    defaultPlanningEventRange,
    expandPlanningEvents,
} from "@/lib/planning/expandPlanningEvents";
import {
    conflictsForApi,
    detectPlanningConflicts,
} from "@/lib/planning/detectConflicts";

export async function GET() {
    try {
        const guard = await requireApiUser();

        if (!guard.ok) {
            return guard.response;
        }

        // Monteur ziet alleen zijn eigen conflicten
        const engineerFilter =
            guard.user.role === "engineer"
                ? { assignedUserId: guard.user.id }
                : {};

        const { rangeStart, rangeEnd } = defaultPlanningEventRange();

        const workorders = await prisma.workorder.findMany({
            where: {
                ...engineerFilter,
                plannedDate: {
                    gte: rangeStart,
                    lte: rangeEnd,
                },
                assignedUserId: { not: null },
                status: {
                    notIn: ["gefactureerd"],
                },
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
        });

        const eventMasters = await prisma.planningEvent.findMany({
            where:
                guard.user.role === "engineer"
                    ? { assignedUserId: guard.user.id }
                    : {
                          assignedUserId: { not: null },
                      },
            include: {
                assignedUser: {
                    select: { id: true, name: true },
                },
            },
        });

        const events = expandPlanningEvents(
            eventMasters,
            rangeStart,
            rangeEnd
        );

        const conflicts = detectPlanningConflicts(workorders, events);

        return NextResponse.json(conflictsForApi(conflicts));
    } catch (error) {
        console.error("CONFLICT CHECK ERROR", error);

        return NextResponse.json(
            { error: "Conflict controle mislukt" },
            { status: 500 }
        );
    }
}
