import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireKeurmeester } from "@/lib/gereedschap/access";
import { buildInspectionPdf } from "@/lib/gereedschap/pdfReport";
import { serializeAsset } from "@/lib/gereedschap/serialize";
import { addMonths, computeToolStatus } from "@/lib/gereedschap/status";
import {
    INSPECTION_RESULTS,
    TOOL_CHECKLISTS,
    TOOL_VALIDITY_MONTHS,
    isToolCategory,
    type InspectionResult,
    type ToolCategory,
} from "@/constants/gereedschap";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
    const guard = await requireKeurmeester();
    if (!guard.ok) return guard.response;

    try {
        const { id } = await context.params;
        const body = await request.json();

        const asset = await prisma.toolAsset.findFirst({
            where: { OR: [{ id }, { code: id }] },
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset niet gevonden" },
                { status: 404 }
            );
        }

        if (asset.archivedAt) {
            return NextResponse.json(
                { error: "Gearchiveerd asset kan niet gekeurd worden" },
                { status: 400 }
            );
        }

        const resultRaw = String(body.result ?? "").trim();
        if (
            !(INSPECTION_RESULTS as readonly string[]).includes(resultRaw)
        ) {
            return NextResponse.json(
                { error: "Resultaat moet goedgekeurd of afgekeurd zijn" },
                { status: 400 }
            );
        }
        const result = resultRaw as InspectionResult;

        const category = isToolCategory(asset.category)
            ? (asset.category as ToolCategory)
            : null;
        const defs = category ? TOOL_CHECKLISTS[category] : [];

        const answers = Array.isArray(body.checklist) ? body.checklist : [];
        const checklist = defs.map((def) => {
            const found = answers.find(
                (a: { id?: string }) => a?.id === def.id
            );
            return {
                id: def.id,
                label: def.label,
                ok: Boolean(found?.ok),
            };
        });

        if (result === "goedgekeurd" && checklist.some((c) => !c.ok)) {
            return NextResponse.json(
                {
                    error: "Alle checklistpunten moeten OK zijn bij goedkeuring",
                },
                { status: 400 }
            );
        }

        const inspectedAt = new Date();
        const validUntil =
            result === "goedgekeurd" && category
                ? addMonths(inspectedAt, TOOL_VALIDITY_MONTHS[category])
                : null;

        const inspectorName =
            guard.user.name?.trim() || guard.user.email || "Keurmeester";

        const pdfBytes = await buildInspectionPdf({
            code: asset.code,
            name: asset.name,
            category: asset.category,
            result,
            inspectedAt,
            validUntil,
            inspectorName,
            notes: body.notes ? String(body.notes) : null,
            checklist,
        });

        const pdfBase64 = `data:application/pdf;base64,${Buffer.from(
            pdfBytes
        ).toString("base64")}`;

        const status = computeToolStatus({
            archivedAt: null,
            lastResult: result,
            nextInspectionAt: validUntil,
            lastInspectionAt: inspectedAt,
        });

        const updated = await prisma.$transaction(async (tx) => {
            await tx.toolInspection.create({
                data: {
                    assetId: asset.id,
                    inspectedAt,
                    inspectorId: guard.user.id,
                    result,
                    checklist,
                    notes: body.notes ? String(body.notes) : null,
                    validUntil,
                    pdfUrl: pdfBase64,
                },
            });

            return tx.toolAsset.update({
                where: { id: asset.id },
                data: {
                    status,
                    lastInspectionAt: inspectedAt,
                    nextInspectionAt: validUntil,
                },
                include: {
                    assignedUser: {
                        select: { id: true, name: true, email: true },
                    },
                    inspections: {
                        orderBy: { inspectedAt: "desc" },
                        include: {
                            inspector: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });
        });

        return NextResponse.json(
            { asset: serializeAsset(updated) },
            { status: 201 }
        );
    } catch (error) {
        console.error("GEREEDSCHAP INSPECT", error);
        return NextResponse.json(
            { error: "Keuring opslaan mislukt" },
            { status: 500 }
        );
    }
}
