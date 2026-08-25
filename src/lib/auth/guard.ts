import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "./session";
import { prisma } from "@/lib/prisma";

type GuardResult =
    | { ok: true; user: SessionUser }
    | { ok: false; response: NextResponse };

/**
 * Gebruik bovenaan een route handler:
 *
 *   const guard = await requireApiRole(["admin"]);
 *   if (!guard.ok) return guard.response;
 *   const user = guard.user;
 */
export async function requireApiRole(
    allowed: string[]
): Promise<GuardResult> {
    const user = await getCurrentUser();

    if (!user) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Niet ingelogd" },
                { status: 401 }
            ),
        };
    }

    if (!allowed.includes(user.role)) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Geen toegang" },
                { status: 403 }
            ),
        };
    }

    return { ok: true, user };
}

/** Alleen ingelogd zijn is genoeg. */
export async function requireApiUser(): Promise<GuardResult> {
    return requireApiRole(["admin", "office", "engineer"]);
}

/**
 * Toegang tot één werkbon.
 *
 * Admin en kantoor mogen elke werkbon. Een monteur alleen de werkbon
 * die aan hem is toegewezen.
 *
 *   const guard = await requireWorkorderAccess(id);
 *   if (!guard.ok) return guard.response;
 */
export async function requireWorkorderAccess(
    workorderId: string
): Promise<GuardResult> {
    const guard = await requireApiUser();

    if (!guard.ok) return guard;

    if (guard.user.role !== "engineer") {
        return guard;
    }

    const workorder = await prisma.workorder.findUnique({
        where: { id: workorderId },
        select: {
            assignedUserId: true,
            extraEngineers: {
                select: { userId: true },
            },
        },
    });

    if (!workorder) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Opdracht niet gevonden" },
                { status: 404 }
            ),
        };
    }

    const magBij =
        workorder.assignedUserId === guard.user.id
        || workorder.extraEngineers.some(
            (extra) => extra.userId === guard.user.id
        );

    if (!magBij) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Geen toegang" },
                { status: 403 }
            ),
        };
    }

    return guard;
}

/**
 * Toegang tot één project.
 *
 * Admin en kantoor mogen elk project. Een monteur alleen actieve
 * projecten (zelfde als project-GET).
 */
export async function requireProjectAccess(
    projectId: string
): Promise<GuardResult> {
    const guard = await requireApiUser();

    if (!guard.ok) return guard;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, status: true },
    });

    if (!project) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Project niet gevonden" },
                { status: 404 }
            ),
        };
    }

    if (guard.user.role === "engineer") {
        const allowed =
            project.status === "actief" || project.status === "new";

        if (!allowed) {
            return {
                ok: false,
                response: NextResponse.json(
                    { error: "Geen toegang" },
                    { status: 403 }
                ),
            };
        }
    }

    return guard;
}
