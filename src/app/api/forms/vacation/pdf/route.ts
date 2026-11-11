import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/guard";
import { generateVacationOverviewPdf } from "@/lib/pdf/vacationOverviewPdf";
import {
    takenLeaveDaysInYear,
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

        const leaves = vacationItemsFromForms(vacationForms);
        const vacation = vacationBalanceForUser(leaves, guard.user.id, year);
        if (vacation.name === "Onbekend") {
            vacation.name = guard.user.name ?? "Onbekend";
        }

        const taken = takenLeaveDaysInYear(leaves, guard.user.id, year);
        const bytes = await generateVacationOverviewPdf({
            year,
            name: vacation.name,
            balance: vacation,
            taken,
        });

        const filename = `vakantieoverzicht-${year}.pdf`;

        return new NextResponse(Buffer.from(bytes), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("VACATION OVERVIEW PDF ERROR", error);
        return NextResponse.json(
            { error: "Overzicht maken mislukt" },
            { status: 500 }
        );
    }
}
