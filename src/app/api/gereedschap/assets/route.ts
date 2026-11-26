import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
    canSeeAsset,
    requireToolBeheer,
    requireToolUser,
} from "@/lib/gereedschap/access";
import { canViewAllAssets } from "@/lib/gereedschap/capabilities";
import { allocateToolCode } from "@/lib/gereedschap/ids";
import { serializeAsset } from "@/lib/gereedschap/serialize";
import { computeToolStatus } from "@/lib/gereedschap/status";
import {
    isToolCategory,
    type ToolCategory,
} from "@/constants/gereedschap";

const assetInclude = {
    assignedUser: {
        select: { id: true, name: true, email: true },
    },
} as const;

export async function GET(request: NextRequest) {
    const guard = await requireToolUser();
    if (!guard.ok) return guard.response;

    try {
        const { searchParams } = request.nextUrl;
        const q = (searchParams.get("q") ?? "").trim();
        const bus = (searchParams.get("bus") ?? "").trim();
        const kantoor = searchParams.get("kantoor");
        const status = (searchParams.get("status") ?? "").trim();
        const category = (searchParams.get("category") ?? "").trim();
        const mine = searchParams.get("mine") === "1";
        const includeArchived = searchParams.get("archived") === "1";

        const where: Record<string, unknown> = {};

        if (!includeArchived) {
            where.archivedAt = null;
        }

        if (status) where.status = status;
        if (category && isToolCategory(category)) where.category = category;
        if (bus) {
            where.busKenteken = {
                contains: bus,
                mode: "insensitive",
            };
        }
        if (kantoor === "1" || kantoor === "true") where.kantoor = true;
        if (kantoor === "0" || kantoor === "false") where.kantoor = false;

        if (q) {
            where.OR = [
                { name: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
                { serialNumber: { contains: q, mode: "insensitive" } },
                { busKenteken: { contains: q, mode: "insensitive" } },
            ];
        }

        const viewAll = canViewAllAssets(guard.caps);
        if (mine || !viewAll) {
            where.assignedUserId = guard.user.id;
        }

        const assets = await prisma.toolAsset.findMany({
            where,
            include: assetInclude,
            orderBy: [{ code: "asc" }],
            take: 500,
        });

        const visible = assets.filter((a) =>
            canSeeAsset(guard.caps, guard.user.id, a.assignedUserId)
        );

        return NextResponse.json({
            assets: visible.map((a) => serializeAsset(a)),
            caps: {
                canManage: guard.caps.gereedschapBeheer || guard.user.role === "admin",
                canInspect: guard.caps.keurmeester || guard.user.role === "admin",
                canViewAll: viewAll,
            },
        });
    } catch (error) {
        console.error("GEREEDSCHAP ASSETS GET", error);
        return NextResponse.json(
            { error: "Assets ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const guard = await requireToolBeheer();
    if (!guard.ok) return guard.response;

    try {
        const body = await request.json();
        const name = String(body.name ?? "").trim();
        const categoryRaw = String(body.category ?? "").trim().toUpperCase();

        if (!name) {
            return NextResponse.json(
                { error: "Naam is verplicht" },
                { status: 400 }
            );
        }
        if (!isToolCategory(categoryRaw)) {
            return NextResponse.json(
                { error: "Ongeldige categorie (G/L/T/E/M)" },
                { status: 400 }
            );
        }

        const category = categoryRaw as ToolCategory;
        const code = await allocateToolCode(category);

        const status = computeToolStatus({});

        let purchasedAt: Date | null = null;
        if (typeof body.purchasedAt === "string" && body.purchasedAt.trim()) {
            const raw = body.purchasedAt.trim().slice(0, 10);
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                purchasedAt = new Date(`${raw}T12:00:00`);
            }
        }

        const asset = await prisma.toolAsset.create({
            data: {
                code,
                category,
                name,
                serialNumber: body.serialNumber
                    ? String(body.serialNumber).trim()
                    : null,
                photoUrl: body.photoUrl ? String(body.photoUrl) : null,
                assignedUserId: body.assignedUserId
                    ? String(body.assignedUserId)
                    : null,
                busKenteken: body.busKenteken
                    ? String(body.busKenteken).trim().toUpperCase()
                    : null,
                kantoor: Boolean(body.kantoor),
                notes: body.notes ? String(body.notes) : null,
                purchasedAt,
                status,
                createdById: guard.user.id,
            },
            include: assetInclude,
        });

        return NextResponse.json(
            { asset: serializeAsset(asset) },
            { status: 201 }
        );
    } catch (error) {
        console.error("GEREEDSCHAP ASSETS POST", error);
        return NextResponse.json(
            { error: "Asset aanmaken mislukt" },
            { status: 500 }
        );
    }
}
