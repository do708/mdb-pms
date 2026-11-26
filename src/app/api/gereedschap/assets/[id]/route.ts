import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
    canSeeAsset,
    requireToolBeheer,
    requireToolUser,
} from "@/lib/gereedschap/access";
import { serializeAsset } from "@/lib/gereedschap/serialize";
import { computeToolStatus } from "@/lib/gereedschap/status";

type Ctx = { params: Promise<{ id: string }> };

const detailInclude = {
    assignedUser: {
        select: { id: true, name: true, email: true },
    },
    inspections: {
        orderBy: { inspectedAt: "desc" as const },
        include: {
            inspector: {
                select: { id: true, name: true, email: true },
            },
        },
    },
};

export async function GET(_request: NextRequest, context: Ctx) {
    const guard = await requireToolUser();
    if (!guard.ok) return guard.response;

    try {
        const { id } = await context.params;
        const asset = await prisma.toolAsset.findFirst({
            where: {
                OR: [{ id }, { code: id }],
            },
            include: detailInclude,
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset niet gevonden" },
                { status: 404 }
            );
        }

        if (!canSeeAsset(guard.caps, guard.user.id, asset.assignedUserId)) {
            return NextResponse.json(
                { error: "Geen toegang tot dit asset" },
                { status: 403 }
            );
        }

        // Herbereken status bij ophalen (binnenkort/verlopen)
        const last = asset.inspections[0];
        const fresh = computeToolStatus({
            archivedAt: asset.archivedAt,
            lastResult: last?.result ?? null,
            nextInspectionAt: asset.nextInspectionAt,
            lastInspectionAt: asset.lastInspectionAt,
        });
        if (fresh !== asset.status) {
            await prisma.toolAsset.update({
                where: { id: asset.id },
                data: { status: fresh },
            });
            asset.status = fresh;
        }

        return NextResponse.json({ asset: serializeAsset(asset) });
    } catch (error) {
        console.error("GEREEDSCHAP ASSET GET", error);
        return NextResponse.json(
            { error: "Asset ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, context: Ctx) {
    const guard = await requireToolBeheer();
    if (!guard.ok) return guard.response;

    try {
        const { id } = await context.params;
        const body = await request.json();

        const existing = await prisma.toolAsset.findFirst({
            where: { OR: [{ id }, { code: id }] },
            include: {
                inspections: {
                    orderBy: { inspectedAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Asset niet gevonden" },
                { status: 404 }
            );
        }

        const data: Record<string, unknown> = {};

        if (body.name !== undefined) {
            const name = String(body.name).trim();
            if (!name) {
                return NextResponse.json(
                    { error: "Naam mag niet leeg zijn" },
                    { status: 400 }
                );
            }
            data.name = name;
        }
        if (body.serialNumber !== undefined) {
            data.serialNumber = body.serialNumber
                ? String(body.serialNumber).trim()
                : null;
        }
        if (body.photoUrl !== undefined) {
            data.photoUrl = body.photoUrl ? String(body.photoUrl) : null;
        }
        if (body.assignedUserId !== undefined) {
            data.assignedUserId = body.assignedUserId
                ? String(body.assignedUserId)
                : null;
        }
        if (body.busKenteken !== undefined) {
            data.busKenteken = body.busKenteken
                ? String(body.busKenteken).trim().toUpperCase()
                : null;
        }
        if (body.kantoor !== undefined) {
            data.kantoor = Boolean(body.kantoor);
        }
        if (body.notes !== undefined) {
            data.notes = body.notes ? String(body.notes) : null;
        }

        if (body.archive === true && !existing.archivedAt) {
            data.archivedAt = new Date();
        }
        if (body.archive === false) {
            data.archivedAt = null;
        }

        const archivedAt =
            (data.archivedAt as Date | null | undefined) !== undefined
                ? (data.archivedAt as Date | null)
                : existing.archivedAt;

        data.status = computeToolStatus({
            archivedAt,
            lastResult: existing.inspections[0]?.result ?? null,
            nextInspectionAt: existing.nextInspectionAt,
            lastInspectionAt: existing.lastInspectionAt,
        });

        const asset = await prisma.toolAsset.update({
            where: { id: existing.id },
            data,
            include: detailInclude,
        });

        return NextResponse.json({ asset: serializeAsset(asset) });
    } catch (error) {
        console.error("GEREEDSCHAP ASSET PUT", error);
        return NextResponse.json(
            { error: "Asset bijwerken mislukt" },
            { status: 500 }
        );
    }
}
