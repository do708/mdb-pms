import { prisma } from "@/lib/prisma";
import {
    archiveCustomerSlug,
    formatArchiveLocationName,
} from "@/lib/archive/formatArchiveLocationName";
import {
    defaultArchiveRoot,
    synologyEnsureFolder,
} from "@/lib/nas/synologyClient";
import { joinNasPath, isNasArchiveEnabled } from "@/lib/nas/synologyConfig";

export async function ensureCustomerArchiveFolder(customerId: string) {
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, name: true },
    });

    if (!customer) {
        throw new Error("Opdrachtgever niet gevonden");
    }

    const slug = archiveCustomerSlug(customer.name);
    const nasPath = joinNasPath(defaultArchiveRoot(), slug);

    const existing = await prisma.archiveFolder.findFirst({
        where: {
            kind: "customer",
            customerId: customer.id,
        },
    });

    if (existing) {
        return existing;
    }

    if (isNasArchiveEnabled()) {
        await synologyEnsureFolder(nasPath);
    }

    return prisma.archiveFolder.create({
        data: {
            kind: "customer",
            name: customer.name,
            slug,
            nasPath,
            customerId: customer.id,
        },
    });
}

export async function ensureLocationArchiveFolder(
    customerId: string,
    locatieRaw?: string | null,
    plaatsRaw?: string | null
) {
    const customerFolder = await ensureCustomerArchiveFolder(customerId);
    const { label, slug, locationKey } = formatArchiveLocationName(
        locatieRaw,
        plaatsRaw
    );

    const existing = await prisma.archiveFolder.findFirst({
        where: {
            kind: "location",
            customerId,
            locationKey,
        },
    });

    if (existing) {
        return existing;
    }

    const nasPath = joinNasPath(customerFolder.nasPath, slug);

    if (isNasArchiveEnabled()) {
        await synologyEnsureFolder(nasPath);
    }

    return prisma.archiveFolder.create({
        data: {
            kind: "location",
            name: label,
            slug,
            nasPath,
            customerId,
            locationKey,
            parentId: customerFolder.id,
        },
    });
}

export async function ensureWorkorderArchiveFolder(
    workorderId: string,
    locationFolderId: string,
    workorderNumber: string
) {
    const locationFolder = await prisma.archiveFolder.findUnique({
        where: { id: locationFolderId },
    });

    if (!locationFolder) {
        throw new Error("Locatiemap niet gevonden");
    }

    const slug = archiveCustomerSlug(workorderNumber);
    const nasPath = joinNasPath(locationFolder.nasPath, slug);

    const existing = await prisma.archiveFolder.findFirst({
        where: { workorderId },
    });

    if (existing) {
        return existing;
    }

    if (isNasArchiveEnabled()) {
        await synologyEnsureFolder(nasPath);
    }

    return prisma.archiveFolder.create({
        data: {
            kind: "workorder",
            name: workorderNumber,
            slug,
            nasPath,
            workorderId,
            parentId: locationFolder.id,
        },
    });
}

/** Zorg dat elke opdrachtgever een archiefmap heeft (DB + NAS). */
export async function syncAllCustomerArchiveFolders() {
    const customers = await prisma.customer.findMany({
        select: { id: true },
        orderBy: { name: "asc" },
    });

    const folders = [];

    for (const customer of customers) {
        folders.push(await ensureCustomerArchiveFolder(customer.id));
    }

    return folders;
}
