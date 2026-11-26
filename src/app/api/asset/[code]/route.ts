import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serializeAsset } from "@/lib/gereedschap/serialize";
import { computeToolStatus } from "@/lib/gereedschap/status";

type Ctx = { params: Promise<{ code: string }> };

/** Publieke read-only status voor QR-portal. */
export async function GET(_request: NextRequest, context: Ctx) {
    try {
        const { code: raw } = await context.params;
        const code = decodeURIComponent(raw).trim().toUpperCase();

        if (!/^MDB-[GLTEM]-\d{5}$/.test(code)) {
            return NextResponse.json(
                { error: "Ongeldige assetcode" },
                { status: 400 }
            );
        }

        const asset = await prisma.toolAsset.findUnique({
            where: { code },
            include: {
                assignedUser: {
                    select: { id: true, name: true, email: true },
                },
                inspections: {
                    orderBy: { inspectedAt: "desc" },
                    take: 1,
                    include: {
                        inspector: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset niet gevonden" },
                { status: 404 }
            );
        }

        const last = asset.inspections[0];
        const status = computeToolStatus({
            archivedAt: asset.archivedAt,
            lastResult: last?.result ?? null,
            nextInspectionAt: asset.nextInspectionAt,
            lastInspectionAt: asset.lastInspectionAt,
        });

        if (status !== asset.status) {
            await prisma.toolAsset.update({
                where: { id: asset.id },
                data: { status },
            });
            asset.status = status;
        }

        return NextResponse.json({
            asset: serializeAsset(asset, { public: true }),
        });
    } catch (error) {
        console.error("PUBLIC ASSET GET", error);
        return NextResponse.json(
            { error: "Asset ophalen mislukt" },
            { status: 500 }
        );
    }
}
