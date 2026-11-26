import {
    TOOL_CATEGORY_LABELS,
    TOOL_STATUS_LABELS,
    isToolCategory,
    type ToolCategory,
    type ToolStatus,
} from "@/constants/gereedschap";

type AssetRow = {
    id: string;
    code: string;
    category: string;
    name: string;
    serialNumber: string | null;
    photoUrl: string | null;
    assignedUserId: string | null;
    busKenteken: string | null;
    kantoor: boolean;
    status: string;
    nextInspectionAt: Date | null;
    lastInspectionAt: Date | null;
    purchasedAt?: Date | null;
    archivedAt: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    assignedUser?: {
        id: string;
        name: string | null;
        email: string;
    } | null;
    inspections?: InspectionRow[];
};

type InspectionRow = {
    id: string;
    inspectedAt: Date;
    result: string;
    checklist: unknown;
    notes: string | null;
    validUntil: Date | null;
    pdfUrl: string | null;
    createdAt: Date;
    inspector?: {
        id: string;
        name: string | null;
        email: string;
    } | null;
};

export function serializeAsset(asset: AssetRow, opts?: { public?: boolean }) {
    const category = isToolCategory(asset.category)
        ? (asset.category as ToolCategory)
        : null;

    const base = {
        id: asset.id,
        code: asset.code,
        category: asset.category,
        categoryLabel: category
            ? TOOL_CATEGORY_LABELS[category]
            : asset.category,
        name: asset.name,
        serialNumber: asset.serialNumber,
        photoUrl: asset.photoUrl,
        busKenteken: asset.busKenteken,
        kantoor: asset.kantoor,
        status: asset.status,
        statusLabel:
            TOOL_STATUS_LABELS[asset.status as ToolStatus] ?? asset.status,
        nextInspectionAt: asset.nextInspectionAt?.toISOString() ?? null,
        lastInspectionAt: asset.lastInspectionAt?.toISOString() ?? null,
        purchasedAt: asset.purchasedAt?.toISOString() ?? null,
        archivedAt: asset.archivedAt?.toISOString() ?? null,
        notes: opts?.public ? null : asset.notes,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
        assignedUser: asset.assignedUser
            ? {
                  id: asset.assignedUser.id,
                  name: asset.assignedUser.name,
                  email: opts?.public ? undefined : asset.assignedUser.email,
              }
            : null,
        qrPath: `/asset/${asset.code}`,
        qrPngPath: `/api/gereedschap/assets/${asset.id}/qr`,
    };

    if (opts?.public) {
        const latest = asset.inspections?.[0];
        return {
            ...base,
            latestInspection: latest
                ? {
                      inspectedAt: latest.inspectedAt.toISOString(),
                      result: latest.result,
                      validUntil: latest.validUntil?.toISOString() ?? null,
                  }
                : null,
        };
    }

    return {
        ...base,
        assignedUserId: asset.assignedUserId,
        inspections: (asset.inspections ?? []).map(serializeInspection),
    };
}

export function serializeInspection(row: InspectionRow) {
    return {
        id: row.id,
        inspectedAt: row.inspectedAt.toISOString(),
        result: row.result,
        checklist: row.checklist,
        notes: row.notes,
        validUntil: row.validUntil?.toISOString() ?? null,
        pdfUrl: row.pdfUrl,
        createdAt: row.createdAt.toISOString(),
        inspector: row.inspector
            ? {
                  id: row.inspector.id,
                  name: row.inspector.name,
                  email: row.inspector.email,
              }
            : null,
    };
}
