import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { formatArchiveLocationLabel } from "@/lib/archive/formatArchiveLocationName";
import {
    ensureCustomerArchiveFolder,
    ensureLocationArchiveFolder,
    ensureWorkorderArchiveFolder,
} from "@/lib/archive/ensureArchiveFolders";
import { isNasArchiveEnabled, joinNasPath } from "@/lib/nas/synologyConfig";
import { synologyUploadFile } from "@/lib/nas/synologyClient";
import { buildWorkorderPhotosZip } from "@/lib/workorders/buildPhotosZip";
import {
    AttachmentNotFoundError,
    candidateStoragePaths,
    downloadAttachmentBytes,
} from "@/lib/attachments/storage";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteSupabasePaths(paths: string[]) {
    const unique = [...new Set(paths.filter(Boolean))];

    if (unique.length === 0) {
        return;
    }

    await supabase.storage.from("workorder-files").remove(unique);
}

function uniqueNasFilename(used: Set<string>, preferred: string): string {
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

async function resolveIntakePdf(
    workorder: {
        id: string;
        archiveNasPath: string | null;
        attachments: Array<{
            url: string;
            filename: string | null;
            originalName: string | null;
            contentType: string | null;
        }>;
        documents: Array<{ url: string; name: string }>;
    }
): Promise<{ buffer: Buffer; filename: string } | null> {
    for (const attachment of workorder.attachments) {
        const name =
            attachment.originalName || attachment.filename || "intake";
        const isPdf =
            name.toLowerCase().endsWith(".pdf")
            || (attachment.contentType || "").includes("pdf")
            || attachment.url.toLowerCase().includes(".pdf");

        if (!isPdf) {
            continue;
        }

        try {
            const buffer = await downloadAttachmentBytes({
                ...attachment,
                workorderId: workorder.id,
                archiveNasPath: workorder.archiveNasPath,
            });

            return { buffer, filename: "intake.pdf" };
        } catch (error) {
            if (!(error instanceof AttachmentNotFoundError)) {
                console.error("ARCHIVE INTAKE ATTACHMENT ERROR", error);
            }
        }
    }

    for (const doc of workorder.documents) {
        if (!doc.url.toLowerCase().includes(".pdf") && !doc.name.toLowerCase().endsWith(".pdf")) {
            continue;
        }

        try {
            const buffer = await downloadAttachmentBytes({
                filename: null,
                url: doc.url,
                originalName: doc.name,
                workorderId: workorder.id,
                archiveNasPath: workorder.archiveNasPath,
            });

            return { buffer, filename: "intake.pdf" };
        } catch (error) {
            if (!(error instanceof AttachmentNotFoundError)) {
                console.error("ARCHIVE INTAKE DOCUMENT ERROR", error);
            }
        }
    }

    return null;
}

export async function archiveWorkorderToNas(workorderId: string) {
    if (!isNasArchiveEnabled()) {
        return { skipped: true as const, reason: "STORAGE_ARCHIVE_ENABLED=false" };
    }

    const workorder = await prisma.workorder.findUnique({
        where: { id: workorderId },
        include: {
            customer: true,
            project: { include: { customer: true } },
            photos: { orderBy: { createdAt: "asc" } },
            attachments: true,
            documents: true,
        },
    });

    if (!workorder) {
        throw new Error("Opdracht niet gevonden");
    }

    if (workorder.archiveStatus === "completed") {
        return { skipped: true as const, reason: "already archived" };
    }

    const customerId =
        workorder.customerId
        || workorder.project?.customerId
        || null;

    if (!customerId) {
        throw new Error("Opdracht heeft geen opdrachtgever");
    }

    await prisma.workorder.update({
        where: { id: workorderId },
        data: {
            archiveStatus: "pending",
            archiveError: null,
        },
    });

    const customerName =
        workorder.customer?.name
        || workorder.project?.customer?.name
        || "";

    try {
        await ensureCustomerArchiveFolder(customerId);

        const locatieRaw = workorder.title;
        const plaatsRaw = workorder.city;

        const locationFolder = await ensureLocationArchiveFolder(
            customerId,
            locatieRaw,
            plaatsRaw
        );

        const workorderFolder = await ensureWorkorderArchiveFolder(
            workorderId,
            locationFolder.id,
            workorder.number
        );

        const dest = workorderFolder.nasPath;
        const copiedStoragePaths: string[] = [];

        if (workorder.pdfData) {
            await synologyUploadFile(
                dest,
                "werkbon.pdf",
                Buffer.from(workorder.pdfData),
                "application/pdf"
            );
        }

        const zipBuffer = await buildWorkorderPhotosZip(workorder.photos);

        if (zipBuffer) {
            await synologyUploadFile(
                dest,
                "fotos.zip",
                zipBuffer,
                "application/zip"
            );

            for (const photo of workorder.photos) {
                copiedStoragePaths.push(
                    ...candidateStoragePaths({
                        filename: null,
                        url: photo.url,
                    })
                );
            }
        }

        const intake = await resolveIntakePdf(workorder);

        if (intake) {
            await synologyUploadFile(
                dest,
                intake.filename,
                intake.buffer,
                "application/pdf"
            );
        }

        const correspondentieFolder = joinNasPath(dest, "correspondentie");
        const usedNames = new Set<string>();

        for (const attachment of workorder.attachments) {
            try {
                const buffer = await downloadAttachmentBytes({
                    ...attachment,
                    workorderId,
                    archiveNasPath: dest,
                });
                const preferred =
                    attachment.originalName
                    || attachment.filename?.split("/").filter(Boolean).pop()
                    || "bijlage";
                const filename = uniqueNasFilename(usedNames, preferred);

                await synologyUploadFile(
                    correspondentieFolder,
                    filename,
                    buffer,
                    attachment.contentType || "application/octet-stream"
                );

                copiedStoragePaths.push(
                    ...candidateStoragePaths({
                        ...attachment,
                        workorderId,
                    })
                );
            } catch (error) {
                if (error instanceof AttachmentNotFoundError) {
                    console.error(
                        "ARCHIVE ATTACHMENT MISSING",
                        attachment.id,
                        attachment.originalName || attachment.filename
                    );
                    continue;
                }

                throw error;
            }
        }

        for (const doc of workorder.documents) {
            try {
                const buffer = await downloadAttachmentBytes({
                    filename: null,
                    url: doc.url,
                    originalName: doc.name,
                    workorderId,
                    archiveNasPath: dest,
                });
                const filename = uniqueNasFilename(
                    usedNames,
                    doc.name || "document"
                );

                await synologyUploadFile(
                    correspondentieFolder,
                    filename,
                    buffer,
                    "application/octet-stream"
                );

                copiedStoragePaths.push(
                    ...candidateStoragePaths({
                        filename: null,
                        url: doc.url,
                        originalName: doc.name,
                        workorderId,
                    })
                );
            } catch (error) {
                if (error instanceof AttachmentNotFoundError) {
                    console.error("ARCHIVE DOCUMENT MISSING", doc.name);
                    continue;
                }

                throw error;
            }
        }

        await deleteSupabasePaths(copiedStoragePaths);

        const label = formatArchiveLocationLabel(
            locatieRaw,
            plaatsRaw,
            customerName
        );

        await prisma.workorder.update({
            where: { id: workorderId },
            data: {
                archiveNasPath: dest,
                archiveLocationLabel: label,
                archivedAt: new Date(),
                archiveStatus: "completed",
                archiveError: null,
                pdfData: null,
            },
        });

        return {
            skipped: false as const,
            nasPath: dest,
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Archiveren mislukt";

        await prisma.workorder.update({
            where: { id: workorderId },
            data: {
                archiveStatus: "failed",
                archiveError: message,
            },
        });

        throw error;
    }
}

export async function processPendingArchives(limit = 10) {
    const pending = await prisma.workorder.findMany({
        where: {
            archiveStatus: "pending",
            status: "gefactureerd",
        },
        take: limit,
        select: { id: true },
    });

    const results = [];

    for (const item of pending) {
        try {
            results.push({
                id: item.id,
                ...(await archiveWorkorderToNas(item.id)),
            });
        } catch (error) {
            results.push({
                id: item.id,
                error:
                    error instanceof Error ? error.message : "mislukt",
            });
        }
    }

    return results;
}
