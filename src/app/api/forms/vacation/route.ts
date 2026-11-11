import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/guard";
import {
    leaveDaysFromData,
    leaveReasonFromData,
    parseLeaveOmvang,
    vacationBalanceForUser,
    vacationItemsFromForms,
    yearFromDateKey,
} from "@/lib/reports/vacation";

export async function GET(request: NextRequest) {
    const guard = await requireApiUser();
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

        const vacationForms = await prisma.formSubmission.findMany({
            where: {
                type: "verlof",
                userId: guard.user.id,
            },
            select: {
                id: true,
                status: true,
                createdAt: true,
                data: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const vacation = vacationBalanceForUser(
            vacationItemsFromForms(vacationForms),
            guard.user.id,
            year
        );

        if (vacation.name === "Onbekend") {
            vacation.name = guard.user.name ?? "Onbekend";
        }

        const requests = vacationForms.map((form) => {
            const data = (form.data ?? {}) as Record<string, unknown>;
            const range = leaveDaysFromData(data);
            return {
                id: form.id,
                status: form.status,
                createdAt: form.createdAt.toISOString(),
                from: range?.from ?? "",
                to: range?.to ?? range?.from ?? "",
                type:
                    typeof data.typeVerlof === "string"
                        ? data.typeVerlof
                        : "",
                reden: leaveReasonFromData(data),
                omvang: parseLeaveOmvang(data.omvang),
                year: yearFromDateKey(range?.from),
            };
        });

        return NextResponse.json({ ...vacation, requests });
    } catch (error) {
        console.error("VACATION BALANCE ERROR", error);
        return NextResponse.json(
            { error: "Vakantiedagen ophalen mislukt" },
            { status: 500 }
        );
    }
}
