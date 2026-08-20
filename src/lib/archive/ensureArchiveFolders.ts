import { prisma } from "@/lib/prisma";
import {
    archiveCustomerSlug,
    archiveSlug,
    formatArchiveLocationName,
    formatCompanyName,
    normalizeKey,
} from "@/lib/archive/formatArchiveLocationName";
import {
    defaultArchiveRoot,
    synologyEnsureFolder,
    synologyRename,
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
            name: formatCompanyName(customer.name),
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
        plaatsRaw,
        customerFolder.name
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

async function uniqueNasPath(nasPath: string): Promise<string> {
    const existing = await prisma.archiveFolder.findUnique({
        where: { nasPath },
        select: { id: true },
    });

    if (!existing) {
        return nasPath;
    }

    for (let i = 2; i < 50; i++) {
        const candidate = `${nasPath}-${i}`;
        const taken = await prisma.archiveFolder.findUnique({
            where: { nasPath: candidate },
            select: { id: true },
        });

        if (!taken) {
            return candidate;
        }
    }

    return `${nasPath}-${Date.now()}`;
}

export async function ensureNamedArchiveFolder(opts: {
    name: string;
    parentId?: string | null;
    kind?: string;
}) {
    const name = formatCompanyName(opts.name);
    const slug = archiveSlug(name);

    if (!name || name === "Onbekende opdrachtgever") {
        throw new Error("Mapnaam ontbreekt");
    }

    const parent = opts.parentId
        ? await prisma.archiveFolder.findUnique({
            where: { id: opts.parentId },
        })
        : null;

    if (opts.parentId && !parent) {
        throw new Error("Bovenliggende map niet gevonden");
    }

    const siblings = await prisma.archiveFolder.findMany({
        where: opts.parentId
            ? { parentId: opts.parentId }
            : { parentId: null },
    });

    const existing = siblings.find(
        (folder) =>
            folder.slug === slug
            || normalizeKey(folder.name) === normalizeKey(name)
    );

    if (existing) {
        return existing;
    }

    const nasPath = await uniqueNasPath(
        joinNasPath(parent?.nasPath || defaultArchiveRoot(), slug)
    );

    if (isNasArchiveEnabled()) {
        await synologyEnsureFolder(nasPath);
    }

    return prisma.archiveFolder.create({
        data: {
            kind: opts.kind || (parent ? "custom" : "custom"),
            name,
            slug,
            nasPath,
            parentId: parent?.id ?? null,
        },
    });
}

export async function renameArchiveFolder(
    folderId: string,
    nextName: string
) {
    const folder = await prisma.archiveFolder.findUnique({
        where: { id: folderId },
    });

    if (!folder) {
        throw new Error("Map niet gevonden");
    }

    const name = formatCompanyName(nextName);
    const slug = archiveSlug(name);

    if (!name || name === "Onbekende opdrachtgever") {
        throw new Error("Mapnaam ontbreekt");
    }

    const siblings = await prisma.archiveFolder.findMany({
        where: folder.parentId
            ? { parentId: folder.parentId, NOT: { id: folder.id } }
            : { parentId: null, NOT: { id: folder.id } },
    });

    if (
        siblings.some(
            (item) =>
                item.slug === slug
                || normalizeKey(item.name) === normalizeKey(name)
        )
    ) {
        throw new Error("Er bestaat al een map met deze naam");
    }

    const parentPath = folder.nasPath.replace(/\/[^/]+$/, "") || defaultArchiveRoot();
    const nextNasPath = await uniqueNasPath(joinNasPath(parentPath, slug));

    if (isNasArchiveEnabled() && folder.nasPath !== nextNasPath) {
        await synologyRename(folder.nasPath, slug);
    }

    const oldPrefix = folder.nasPath;

    await prisma.archiveFolder.update({
        where: { id: folder.id },
        data: { name, slug, nasPath: nextNasPath },
    });

    const descendants = await prisma.archiveFolder.findMany({
        where: { nasPath: { startsWith: `${oldPrefix}/` } },
    });

    for (const child of descendants) {
        await prisma.archiveFolder.update({
            where: { id: child.id },
            data: {
                nasPath: nextNasPath + child.nasPath.slice(oldPrefix.length),
            },
        });
    }

    const files = await prisma.archiveFile.findMany({
        where: {
            storage: "nas",
            storagePath: { startsWith: `${oldPrefix}/` },
        },
    });

    for (const file of files) {
        await prisma.archiveFile.update({
            where: { id: file.id },
            data: {
                storagePath: nextNasPath + file.storagePath.slice(oldPrefix.length),
            },
        });
    }

    return prisma.archiveFolder.findUniqueOrThrow({
        where: { id: folder.id },
    });
}
