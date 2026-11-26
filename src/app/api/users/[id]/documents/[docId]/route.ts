import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { parseUserDocumentType } from "@/constants/userDocumentTypes";
import { ensureUserDocumentsTable } from "@/lib/users/ensureUserDocuments";
import { serializeUserDocument } from "@/lib/users/serializeUserDocument";
import { deleteUserDocumentFile } from "@/lib/users/userDocumentStorage";

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
    const guard = await requireApiRole(["admin"]);
    if (!guard.ok) return guard.response;

    try {
        await ensureUserDocumentsTable();
        const { id, docId } = await context.params;
        const body = await request.json().catch(() => ({}));

        const existing = await prisma.userDocument.findFirst({
            where: { id: docId, userId: id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Document niet gevonden" },
                { status: 404 }
            );
        }

        const data: {
            type?: string;
            number?: string | null;
            expiresAt?: Date | null;
            neverExpires?: boolean;
            expiryNotifiedAt?: Date | null;
        } = {};

        if (body.type !== undefined) {
            data.type = parseUserDocumentType(body.type);
        }

        if (body.number !== undefined) {
            const n = String(body.number ?? "").trim();
            data.number = n || null;
        }

        if (body.neverExpires !== undefined) {
            data.neverExpires = Boolean(body.neverExpires);
            if (data.neverExpires) {
                data.expiresAt = null;
                data.expiryNotifiedAt = null;
            }
        }

        if (body.expiresAt !== undefined && !data.neverExpires) {
            const raw =
                body.expiresAt === null || body.expiresAt === ""
                    ? ""
                    : String(body.expiresAt).trim().slice(0, 10);

            if (!raw) {
                data.expiresAt = null;
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                data.expiresAt = new Date(`${raw}T12:00:00`);
                // Nieuwe datum → opnieuw mogen mailen in de 1-maand-window
                if (
                    !existing.expiresAt
                    || existing.expiresAt.toISOString().slice(0, 10) !== raw
                ) {
                    data.expiryNotifiedAt = null;
                }
            } else {
                return NextResponse.json(
                    { error: "Ongeldige verloopdatum" },
                    { status: 400 }
                );
            }
        }

        const neverExpires =
            data.neverExpires !== undefined
                ? data.neverExpires
                : existing.neverExpires;
        const expiresAt =
            data.expiresAt !== undefined ? data.expiresAt : existing.expiresAt;

        if (!neverExpires && !expiresAt && body.expiresAt !== undefined) {
            // Mag leeg blijven tot gebruiker invult; geen hard error
        }

        const doc = await prisma.userDocument.update({
            where: { id: docId },
            data,
        });

        return NextResponse.json(serializeUserDocument(doc));
    } catch (error) {
        console.error("USER DOCUMENT PATCH", error);
        return NextResponse.json(
            { error: "Document bijwerken mislukt" },
            { status: 500 }
        );
    }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
    const guard = await requireApiRole(["admin"]);
    if (!guard.ok) return guard.response;

    try {
        await ensureUserDocumentsTable();
        const { id, docId } = await context.params;

        const existing = await prisma.userDocument.findFirst({
            where: { id: docId, userId: id },
            select: { id: true, fileUrl: true },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Document niet gevonden" },
                { status: 404 }
            );
        }

        try {
            await deleteUserDocumentFile(existing.fileUrl);
        } catch (storageError) {
            console.error("USER DOCUMENT STORAGE DELETE", storageError);
        }

        await prisma.userDocument.delete({ where: { id: docId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("USER DOCUMENT DELETE", error);
        return NextResponse.json(
            { error: "Document verwijderen mislukt" },
            { status: 500 }
        );
    }
}
