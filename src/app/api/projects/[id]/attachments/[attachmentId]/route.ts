import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireProjectAccess } from "@/lib/auth/guard";
import {
    attachmentNotFoundResponse,
    fileDownloadResponse,
    shouldInlineFile,
} from "@/lib/attachments/fileResponse";
import {
    AttachmentNotFoundError,
    downloadAttachmentBytes,
    removeAttachmentObject,
} from "@/lib/attachments/storage";

export const runtime = "nodejs";

export async function GET(
    request: NextRequest,
    context: {
        params: Promise<{ id: string; attachmentId: string }>;
    }
) {
    try {
        const { id, attachmentId } = await context.params;
        const guard = await requireProjectAccess(id);

        if (!guard.ok) {
            return guard.response;
        }

        const attachment = await prisma.projectAttachment.findUnique({
            where: { id: attachmentId },
        });

        if (!attachment || attachment.projectId !== id) {
            return NextResponse.json(
                { error: "Bijlage niet gevonden" },
                { status: 404 }
            );
        }

        const buffer = await downloadAttachmentBytes({
            ...attachment,
            projectId: id,
        });
        const displayName =
            attachment.originalName
            || attachment.filename
            || "bestand";

        return fileDownloadResponse({
            buffer,
            filename: displayName,
            contentType: attachment.contentType,
            inline: shouldInlineFile(displayName, attachment.contentType),
        });
    } catch (error) {
        if (error instanceof AttachmentNotFoundError) {
            return attachmentNotFoundResponse(request);
        }

        console.error("PROJECT ATTACHMENT GET ERROR:", error);

        return NextResponse.json(
            { error: "Bestand ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: {
        params: Promise<{ id: string; attachmentId: string }>;
    }
) {
    try {
        const { id, attachmentId } = await context.params;
        const guard = await requireApiRole(["admin", "office"]);

        if (!guard.ok) {
            return guard.response;
        }

        const attachment = await prisma.projectAttachment.findUnique({
            where: { id: attachmentId },
        });

        if (!attachment || attachment.projectId !== id) {
            return NextResponse.json(
                { error: "Bijlage niet gevonden" },
                { status: 404 }
            );
        }

        await removeAttachmentObject({
            ...attachment,
            projectId: id,
        }).catch(() => {});

        await prisma.projectAttachment.delete({
            where: { id: attachmentId },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("PROJECT ATTACHMENT DELETE ERROR:", error);

        return NextResponse.json(
            { error: "Bijlage verwijderen mislukt" },
            { status: 500 }
        );
    }
}
