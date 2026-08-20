import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireWorkorderAccess } from "@/lib/auth/guard";
import {
    isEmailFilename,
    parseEmailFile,
} from "@/lib/attachments/parseEmail";
import { AttachmentNotFoundError, downloadAttachmentBytes } from "@/lib/attachments/storage";

export const runtime = "nodejs";

export async function GET(
    _request: NextRequest,
    context: {
        params: Promise<{ id: string; attachmentId: string }>;
    }
) {
    try {
        const { id, attachmentId } = await context.params;
        const guard = await requireWorkorderAccess(id);

        if (!guard.ok) {
            return guard.response;
        }

        const [attachment, workorder] = await Promise.all([
            prisma.workorderAttachment.findUnique({
                where: { id: attachmentId },
            }),
            prisma.workorder.findUnique({
                where: { id },
                select: { archiveNasPath: true },
            }),
        ]);

        if (!attachment || attachment.workorderId !== id) {
            return NextResponse.json(
                { error: "Bijlage niet gevonden" },
                { status: 404 }
            );
        }

        const displayName =
            attachment.originalName
            || attachment.filename
            || "bestand";

        if (!isEmailFilename(displayName)) {
            return NextResponse.json(
                { error: "Dit bestand is geen e-mail" },
                { status: 400 }
            );
        }

        const buffer = await downloadAttachmentBytes({
            ...attachment,
            workorderId: id,
            archiveNasPath: workorder?.archiveNasPath ?? null,
        });

        try {
            const mail = await parseEmailFile(buffer, displayName);

            return NextResponse.json(mail);
        } catch (parseError) {
            console.error("ATTACHMENT EMAIL PARSE ERROR:", parseError);

            return NextResponse.json(
                {
                    error: "Dit e-mailbestand kon niet worden gelezen",
                    downloadable: true,
                },
                { status: 422 }
            );
        }
    } catch (error) {
        if (error instanceof AttachmentNotFoundError) {
            return NextResponse.json(
                { error: "Bestand niet gevonden in de opslag" },
                { status: 404 }
            );
        }

        console.error("ATTACHMENT PREVIEW ERROR:", error);

        return NextResponse.json(
            { error: "E-mail bekijken mislukt" },
            { status: 500 }
        );
    }
}
