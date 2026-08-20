import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireWorkorderAccess } from "@/lib/auth/guard";
import {
    extractNestedEmailAttachment,
    isEmailFilename,
} from "@/lib/attachments/parseEmail";
import {
    attachmentNotFoundResponse,
    fileDownloadResponse,
    shouldInlineFile,
} from "@/lib/attachments/fileResponse";
import {
    AttachmentNotFoundError,
    downloadAttachmentBytes,
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
        const guard = await requireWorkorderAccess(id);

        if (!guard.ok) {
            return guard.response;
        }

        const attachment = await prisma.workorderAttachment.findUnique({
            where: { id: attachmentId },
        });

        if (!attachment || attachment.workorderId !== id) {
            return NextResponse.json(
                { error: "Bijlage niet gevonden" },
                { status: 404 }
            );
        }

        const buffer = await downloadAttachmentBytes(attachment);
        const displayName =
            attachment.originalName
            || attachment.filename
            || "bestand";

        const nestedParam = request.nextUrl.searchParams.get("nested");

        if (nestedParam !== null) {
            const nestedIndex = Number(nestedParam);

            if (!Number.isInteger(nestedIndex) || nestedIndex < 0) {
                return NextResponse.json(
                    { error: "Ongeldige bijlage" },
                    { status: 400 }
                );
            }

            if (!isEmailFilename(displayName)) {
                return NextResponse.json(
                    { error: "Dit bestand is geen e-mail" },
                    { status: 400 }
                );
            }

            const nested = await extractNestedEmailAttachment(
                buffer,
                displayName,
                nestedIndex
            );

            if (!nested) {
                return NextResponse.json(
                    { error: "Bijlage niet gevonden in dit bericht" },
                    { status: 404 }
                );
            }

            return fileDownloadResponse({
                buffer: nested.content,
                filename: nested.filename,
                contentType: nested.contentType,
                inline: shouldInlineFile(nested.filename, nested.contentType),
            });
        }

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

        console.error("ATTACHMENT GET ERROR:", error);

        return NextResponse.json(
            { error: "Bestand ophalen mislukt" },
            { status: 500 }
        );
    }
}
