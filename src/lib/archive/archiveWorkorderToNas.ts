import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { formatArchiveLocationLabel } from "@/lib/archive/formatArchiveLocationName";
import {
    ensureCustomerArchiveFolder,
    ensureLocationArchiveFolder,
    ensureWorkorderArchiveFolder,
} from "@/lib/archive/ensureArchiveFolders";
import { isNasArchiveEnabled } from "@/lib/nas/synologyConfig";
import { synologyUploadFile } from "@/lib/nas/synologyClient";
import { buildWorkorderPhotosZip } from "@/lib/workorders/buildPhotosZip";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function supabasePathFromUrl(url: string): string | null {
    const marker = "/workorder-files/";

    if (!url.includes(marker)) {
        return null;
    }

    return url.split(marker)[1]?.split("?")[0] ?? null;
}

async function deleteSupabaseObject(url: string) {
    const path = supabasePathFromUrl(url);

    if (!path) {
        return;
    }

    await supabase.storage.from("workorder-files").remove([path]);
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            return null;
        }

        return Buffer.from(await response.arrayBuffer());
    } catch {
        return null;
    }
}

async function resolveIntakePdf(
    workorder: {
        attachments: Array<{ url: string; filename: string | null }>;
        documents: Array<{ url: string; name: string }>;
    }
): Promise<{ buffer: Buffer; filename: string } | null> {
    for (const attachment of workorder.attachments) {
        const buffer = await fetchBuffer(attachment.url);

        if (!buffer) {
            continue;
        }

        const name = attachment.filename || "intake";
        const isPdf =
            name.toLowerCase().endsWith(".pdf")
            || attachment.url.toLowerCase().includes(".pdf");

        if (isPdf) {
            return { buffer, filename: "intake.pdf" };
        }
    }

    for (const doc of workorder.documents) {
        if (!doc.url.toLowerCase().includes(".pdf")) {
            continue;
        }

        const buffer = await fetchBuffer(doc.url);

        if (buffer) {
            return { buffer, filename: "intake.pdf" };
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

        const urlsToDelete: string[] = [
            ...workorder.photos.map((p) => p.url),
            ...workorder.attachments.map((a) => a.url),
            ...workorder.documents.map((d) => d.url),
        ];

        for (const url of urlsToDelete) {
            await deleteSupabaseObject(url);
        }

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
