import { prisma } from "@/lib/prisma";
import { archiveSlug } from "@/lib/archive/formatArchiveLocationName";
import { ensureProjectArchiveFolder } from "@/lib/archive/ensureArchiveFolders";
import {
    AttachmentNotFoundError,
    downloadAttachmentBytes,
} from "@/lib/attachments/storage";
import { synologyUploadFile } from "@/lib/nas/synologyClient";
import { isNasArchiveEnabled } from "@/lib/nas/synologyConfig";

function uniqueFilename(used: Set<string>, preferred: string): string {
    const cleaned =
        preferred.replace(/[\\/:*?"<>|]+/g, "_").trim() || "bestand";
    const lastDot = cleaned.lastIndexOf(".");
    const base = lastDot > 0 ? cleaned.slice(0, lastDot) : cleaned;
    const ext = lastDot > 0 ? cleaned.slice(lastDot) : "";

    let name = cleaned;
    let n = 2;

    while (used.has(name.toLowerCase())) {
        name = `${base}-${n}${ext}`;
        n += 1;
    }

    used.add(name.toLowerCase());
    return name;
}

export async function archiveCompletedProject(projectId: string) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            customer: { select: { id: true, name: true } },
            bijlagen: true,
        },
    });

    if (!project) {
        throw new Error("Project niet gevonden");
    }

    if (project.status !== "afgerond") {
        return { skipped: true as const, reason: "niet afgerond" };
    }

    const folder = await ensureProjectArchiveFolder(project);
    const usedNames = new Set(
        (
            await prisma.archiveFile.findMany({
                where: { folderId: folder.id },
                select: { name: true },
            })
        ).map((file) => file.name.toLowerCase())
    );

    for (const attachment of project.bijlagen) {
        const preferred =
            attachment.originalName || attachment.filename || "bijlage";

        if (usedNames.has(preferred.toLowerCase())) {
            continue;
        }

        try {
            const name = uniqueFilename(usedNames, preferred);
            const contentType =
                attachment.contentType || "application/octet-stream";

            if (!isNasArchiveEnabled()) {
                await prisma.archiveFile.create({
                    data: {
                        folderId: folder.id,
                        name,
                        storage: "supabase",
                        storagePath: attachment.filename || attachment.url,
                        url: attachment.url,
                        contentType,
                    },
                });
                continue;
            }

            const buffer = await downloadAttachmentBytes({
                filename: attachment.filename,
                url: attachment.url,
                originalName: attachment.originalName,
                projectId: project.id,
            });
            const lastDot = name.lastIndexOf(".");
            const base = lastDot > 0 ? name.slice(0, lastDot) : name;
            const ext = lastDot > 0 ? name.slice(lastDot) : "";
            const nasFileName = `${archiveSlug(base)}${ext.replace(/[^a-zA-Z0-9.]/g, "")}`;
            const storagePath = await synologyUploadFile(
                folder.nasPath,
                nasFileName,
                buffer,
                contentType
            );

            await prisma.archiveFile.create({
                data: {
                    folderId: folder.id,
                    name,
                    storage: "nas",
                    storagePath,
                    url: null,
                    contentType,
                    size: buffer.length,
                },
            });
        } catch (error) {
            if (error instanceof AttachmentNotFoundError) {
                console.error(
                    "ARCHIVE PROJECT ATTACHMENT MISSING",
                    attachment.id,
                    preferred
                );
                continue;
            }

            throw error;
        }
    }

    return { skipped: false as const, folderId: folder.id };
}
