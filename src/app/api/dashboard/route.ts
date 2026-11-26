import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiRole } from "@/lib/auth/guard";

import { excludeArchivedForms } from "@/lib/archive";
import {
    loadMateriaalKlaarzettenUrgent,
    loadNietGereedMeldingen,
} from "@/lib/officeNotifications";
import { loadForgottenProjectHours } from "@/lib/projects/forgottenHours";
import { ensureGereedschapUserColumns } from "@/lib/prismaEnsure";

/** Alleen velden die het dashboard nodig heeft — géén gereedschap-flags. */
const assignedUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    active: true,
} as const;

const workorderListInclude = {
    customer: true,
    project: {
        include: {
            customer: true,
        },
    },
    assignedUser: {
        select: assignedUserSelect,
    },
} as const;

function prismaErrorMeta(error: unknown): {
    code?: string;
    meta?: unknown;
    message: string;
} {
    if (!error || typeof error !== "object") {
        return { message: String(error ?? "onbekend") };
    }
    const e = error as {
        code?: string;
        meta?: unknown;
        message?: string;
    };
    return {
        code: e.code,
        meta: e.meta,
        message: e.message ?? "onbekend",
    };
}

async function safeCall<T>(
    label: string,
    fn: () => Promise<T>,
    fallback: T
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        console.error(`DASHBOARD (${label})`, error);
        return fallback;
    }
}

export async function GET() {
    const guard = await requireApiRole(["admin", "office", "magazijn"]);
    if (!guard.ok) return guard.response;

    try {
        // Snelle User-cols; queries gebruiken smalle selects (geen gereedschap-flags).
        await ensureGereedschapUserColumns();

        if (guard.user.role === "magazijn") {
            const materiaalWaarschuwing = await loadMateriaalKlaarzettenUrgent();
            return NextResponse.json({
                counters: {
                    materiaal: materiaalWaarschuwing.length,
                },
                materiaalWaarschuwing,
            });
        }

        const startVandaag = new Date();
        startVandaag.setHours(0, 0, 0, 0);

        const NOG_IN_TE_VULLEN = ["ontvangen", "afspraak", "ingepland"];

        const teLaatWhere = {
            plannedDate: {
                lt: startVandaag,
            },
            status: {
                in: NOG_IN_TE_VULLEN,
            },
        };

        const [
            ingepland,
            uitgevoerd,
            teLaatCount,
            teLaat,
            uitgevoerdLijst,
            recentForms,
            openForms,
            openFormsList,
            openAanvragen,
            materiaalWaarschuwing,
            nietGereed,
            vergetenProjectUren,
        ] = await Promise.all([
            prisma.workorder.count({ where: { status: "ingepland" } }),
            prisma.workorder.count({ where: { status: "uitgevoerd" } }),
            prisma.workorder.count({ where: teLaatWhere }),
            prisma.workorder.findMany({
                where: teLaatWhere,
                orderBy: { plannedDate: "asc" },
                omit: {
                    formData: true,
                    aanvraagSpecificaties: true,
                    pdfData: true,
                },
                include: workorderListInclude,
            }),
            prisma.workorder.findMany({
                where: { status: "uitgevoerd" },
                orderBy: [
                    { sentAt: "desc" },
                    { workDate: "desc" },
                    { updatedAt: "desc" },
                ],
                omit: {
                    formData: true,
                    aanvraagSpecificaties: true,
                    pdfData: true,
                },
                include: workorderListInclude,
            }),
            prisma.formSubmission.findMany({
                take: 10,
                where: { ...excludeArchivedForms() },
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { name: true } },
                },
            }),
            prisma.formSubmission.count({
                where: { status: "ingediend" },
            }),
            prisma.formSubmission.findMany({
                where: { status: "ingediend" },
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { name: true } },
                },
            }),
            prisma.aanvraag.count({
                where: { status: "open" },
            }),
            safeCall("materiaal", () => loadMateriaalKlaarzettenUrgent(), []),
            safeCall("niet-gereed", () => loadNietGereedMeldingen(), []),
            safeCall("projecturen-vergeten", () => loadForgottenProjectHours(), []),
        ]);

        return NextResponse.json({
            counters: {
                ingepland,
                uitgevoerd,
                teLaat: teLaatCount,
                openForms,
                openAanvragen,
                materiaal: materiaalWaarschuwing.length,
                nietGereed: nietGereed.length,
                projectUrenVergeten: vergetenProjectUren.length,
            },
            materiaalWaarschuwing,
            nietGereed,
            vergetenProjectUren,
            teLaat,
            openFormsList,
            uitgevoerdLijst,
            recentForms,
        });
    } catch (error) {
        const meta = prismaErrorMeta(error);
        console.error("DASHBOARD API ERROR", error);

        const isMissingColumn = meta.code === "P2022";
        return NextResponse.json(
            {
                error: isMissingColumn
                    ? "Database-schema mist kolommen. Draai npm run db:migrate tegen Production, of vernieuw na deploy van ensure-schema."
                    : "Dashboard gegevens ophalen mislukt",
                code: meta.code ?? "DASHBOARD_ERROR",
                detail: meta.message,
                meta: meta.meta,
            },
            { status: 500 }
        );
    }
}
