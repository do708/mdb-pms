import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireOverzicht } from "@/lib/gereedschap/access";
import {
    assetsToCsv,
    assetsToExcel,
    type ExportAssetRow,
} from "@/lib/gereedschap/export";
import { buildRegisterPdf } from "@/lib/gereedschap/registerPdf";

export async function GET(request: NextRequest) {
    const guard = await requireOverzicht();
    if (!guard.ok) return guard.response;

    try {
        const format = (
            request.nextUrl.searchParams.get("format") ?? "csv"
        ).toLowerCase();

        const assets = await prisma.toolAsset.findMany({
            where: { archivedAt: null },
            include: {
                assignedUser: {
                    select: { name: true, email: true },
                },
            },
            orderBy: { code: "asc" },
        });

        const rows: ExportAssetRow[] = assets.map((a) => ({
            code: a.code,
            category: a.category,
            name: a.name,
            serialNumber: a.serialNumber,
            status: a.status,
            busKenteken: a.busKenteken,
            kantoor: a.kantoor,
            assignedName:
                a.assignedUser?.name ?? a.assignedUser?.email ?? null,
            lastInspectionAt: a.lastInspectionAt,
            nextInspectionAt: a.nextInspectionAt,
            purchasedAt: a.purchasedAt ?? null,
            createdAt: a.createdAt,
        }));

        if (format === "xlsx" || format === "excel") {
            const buf = await assetsToExcel(rows);
            return new NextResponse(new Uint8Array(buf), {
                status: 200,
                headers: {
                    "Content-Type":
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition":
                        'attachment; filename="mdb-gereedschap.xlsx"',
                },
            });
        }

        if (format === "pdf") {
            const pdf = await buildRegisterPdf(rows);
            return new NextResponse(Buffer.from(pdf), {
                status: 200,
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition":
                        'attachment; filename="mdb-gereedschapsregister.pdf"',
                },
            });
        }

        const csv = assetsToCsv(rows);
        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition":
                    'attachment; filename="mdb-gereedschap.csv"',
            },
        });
    } catch (error) {
        console.error("GEREEDSCHAP EXPORT", error);
        return NextResponse.json(
            { error: "Export mislukt" },
            { status: 500 }
        );
    }
}
