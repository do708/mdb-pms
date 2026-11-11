import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/guard";
import {
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
        });

        const vacation = vacationBalanceForUser(
            vacationItemsFromForms(vacationForms),
            guard.user.id,
            year
        );

        if (vacation.name === "Onbekend") {
            vacation.name = guard.user.name ?? "Onbekend";
        }

        return NextResponse.json(vacation);
    } catch (error) {
        console.error("VACATION BALANCE ERROR", error);
        return NextResponse.json(
            { error: "Vakantiedagen ophalen mislukt" },
            { status: 500 }
        );
    }
}
