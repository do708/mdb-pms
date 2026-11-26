import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import {
    contentTypeForFile,
    extensionForContentType,
} from "@/lib/attachments/contentType";
import {
    compressPhoto,
    photoStorageName,
} from "@/lib/images/compressPhoto";
import { parseUserDocumentType } from "@/constants/userDocumentTypes";
import { ensureUserDocumentsTable } from "@/lib/users/ensureUserDocuments";
import { serializeUserDocument } from "@/lib/users/serializeUserDocument";
import { uploadUserDocumentToNas } from "@/lib/users/userDocumentStorage";
import { isNasConfigured } from "@/lib/nas/synologyConfig";

export const runtime = "nodejs";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

async function assertUserExists(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
    });
}

export async function GET(_request: NextRequest, context: Ctx) {
    const guard = await requireApiRole(["admin", "office"]);
    if (!guard.ok) return guard.response;

    try {
        await ensureUserDocumentsTable();
        const { id } = await context.params;

        const user = await assertUserExists(id);
        if (!user) {
            return NextResponse.json(
                { error: "Gebruiker niet gevonden" },
                { status: 404 }
            );
        }

        const docs = await prisma.userDocument.findMany({
            where: { userId: id },
            orderBy: [{ neverExpires: "asc" }, { expiresAt: "asc" }, { createdAt: "desc" }],
        });

        return NextResponse.json(docs.map(serializeUserDocument));
    } catch (error) {
        console.error("USER DOCUMENTS GET", error);
        return NextResponse.json(
            { error: "Documenten ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest, context: Ctx) {
    const guard = await requireApiRole(["admin"]);
    if (!guard.ok) return guard.response;

    try {
        await ensureUserDocumentsTable();
        const { id } = await context.params;

        const user = await assertUserExists(id);
        if (!user) {
            return NextResponse.json(
                { error: "Gebruiker niet gevonden" },
                { status: 404 }
            );
        }

        if (!isNasConfigured()) {
            return NextResponse.json(
                {
                    error:
                        "NAS is niet ingesteld. Gebruikersdocumenten horen op de NAS, niet in Supabase.",
                },
                { status: 503 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (
            !file
            || typeof file === "string"
            || typeof (file as File).arrayBuffer !== "function"
            || (file as File).size <= 0
        ) {
            return NextResponse.json(
                { error: "Geen bestand ontvangen" },
                { status: 400 }
            );
        }

        const upload = file as File;
        const type = parseUserDocumentType(formData.get("type"));
        const numberRaw = String(formData.get("number") ?? "").trim();
        const neverExpires =
            String(formData.get("neverExpires") ?? "").toLowerCase() === "true"
            || String(formData.get("neverExpires") ?? "") === "1";
        const expiresRaw = String(formData.get("expiresAt") ?? "")
            .trim()
            .slice(0, 10);

        let expiresAt: Date | null = null;
        if (!neverExpires) {
            if (expiresRaw && /^\d{4}-\d{2}-\d{2}$/.test(expiresRaw)) {
                expiresAt = new Date(`${expiresRaw}T12:00:00`);
            }
        }

        const contentType = contentTypeForFile(upload);
        const raw = Buffer.from(await upload.arrayBuffer());
        const payload = contentType.startsWith("image/")
            ? await compressPhoto(raw, contentType)
            : {
                  buffer: raw,
                  contentType,
                  extension: extensionForContentType(
                      upload.name,
                      contentType
                  ),
              };

        const veiligeNaam = payload.extension
            ? photoStorageName(upload.name, payload.extension)
            : upload.name.replace(/[^a-zA-Z0-9._-]/g, "_");

        const stored = await uploadUserDocumentToNas(
            id,
            veiligeNaam,
            payload.buffer,
            payload.contentType || contentType
        );

        const doc = await prisma.userDocument.create({
            data: {
                userId: id,
                type,
                number: numberRaw || null,
                expiresAt,
                neverExpires,
                fileUrl: stored.fileUrl,
                fileName: stored.fileName,
                originalName: upload.name,
                contentType: payload.contentType || contentType,
            },
        });

        return NextResponse.json(serializeUserDocument(doc), { status: 201 });
    } catch (error) {
        console.error("USER DOCUMENTS POST", error);
        const message = error instanceof Error ? error.message : "";
        return NextResponse.json(
            {
                error:
                    /nas|niet ingesteld|niet geconfigureerd/i.test(message)
                        ? "Bestandsopslag (NAS) is niet geconfigureerd"
                        : message || "Document opslaan mislukt",
            },
            { status: 500 }
        );
    }
}
