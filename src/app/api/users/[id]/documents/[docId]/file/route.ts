import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { contentTypeForFilename } from "@/lib/attachments/contentType";
import { ensureUserDocumentsTable } from "@/lib/users/ensureUserDocuments";
import { downloadUserDocumentFile } from "@/lib/users/userDocumentStorage";

export const runtime = "nodejs";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
    const guard = await requireApiRole(["admin", "office"]);
    if (!guard.ok) return guard.response;

    try {
        await ensureUserDocumentsTable();
        const { id, docId } = await context.params;

        const doc = await prisma.userDocument.findFirst({
            where: { id: docId, userId: id },
            select: {
                fileUrl: true,
                originalName: true,
                contentType: true,
                fileName: true,
            },
        });

        if (!doc) {
            return NextResponse.json(
                { error: "Document niet gevonden" },
                { status: 404 }
            );
        }

        const buffer = await downloadUserDocumentFile(doc.fileUrl);
        const filename = (doc.originalName || doc.fileName || "document")
            .replace(/"/g, "")
            .replace(/[/\\]/g, "-");
        const contentType =
            doc.contentType
            || contentTypeForFilename(filename);

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("USER DOCUMENT FILE GET", error);
        return NextResponse.json(
            { error: "Bestand ophalen mislukt" },
            { status: 500 }
        );
    }
}
