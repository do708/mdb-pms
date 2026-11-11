import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import {
    VACATION_DAYS_PER_YEAR,
    vacationBalanceForUser,
    vacationBalances,
    vacationItemsFromForms,
    yearFromDateKey,
    type VacationBalance,
} from "@/lib/reports/vacation";

export async function GET(request: NextRequest) {
    const guard = await requireApiRole(["admin", "office"]);
    if (!guard.ok) {
        return guard.response;
    }

    try {
        const yearParam = request.nextUrl.searchParams.get("year");
        const year = yearFromDateKey(
            yearParam && /^\d{4}$/.test(yearParam)
                ? `${yearParam}-01-01`
                : null
        );

        const [engineers, vacationForms] = await Promise.all([
            prisma.user.findMany({
                where: {
                    role: "engineer",
                    active: true,
                },
                select: {
                    id: true,
                    name: true,
                },
                orderBy: {
                    name: "asc",
                },
            }),
            prisma.formSubmission.findMany({
                where: {
                    type: "verlof",
                    status: {
                        in: ["geaccepteerd", "ingediend"],
                    },
                },
                select: {
                    status: true,
                    data: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
        ]);

        const leaves = vacationItemsFromForms(vacationForms);
        const byId = new Map<string, VacationBalance>(
            vacationBalances(leaves, year).map((row) => [row.userId, row])
        );

        const balances = engineers.map((engineer) => {
            const existing = byId.get(engineer.id);
            if (existing) {
                return {
                    ...existing,
                    name: engineer.name ?? existing.name,
                };
            }
            const empty = vacationBalanceForUser(leaves, engineer.id, year);
            return {
                ...empty,
                name: engineer.name ?? empty.name,
            };
        });

        const years = new Set<number>([year, new Date().getFullYear()]);
        for (const item of leaves) {
            years.add(yearFromDateKey(item.from));
            years.add(yearFromDateKey(item.to));
        }

        return NextResponse.json({
            year,
            entitledBase: VACATION_DAYS_PER_YEAR,
            years: [...years].sort((a, b) => b - a),
            balances,
        });
    } catch (error) {
        console.error("VACATION TEAM ERROR", error);
        return NextResponse.json(
            { error: "Vakantiedagen overzicht ophalen mislukt" },
            { status: 500 }
        );
    }
}
