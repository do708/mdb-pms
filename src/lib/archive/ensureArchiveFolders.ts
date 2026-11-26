import { prisma } from "@/lib/prisma";
import {
    archiveCustomerSlug,
    archiveSlug,
    archiveWorkorderTree,
    formatArchiveLocationName,
    formatCompanyName,
    normalizeKey,
} from "@/lib/archive/formatArchiveLocationName";
import { clearArchiveHiddenPath } from "@/lib/archive/ensureArchiveHiddenPaths";
import {
    defaultArchiveRoot,
    synologyDeleteFile,
    synologyEnsureFolder,
    synologyRename,
} from "@/lib/nas/synologyClient";
import {
    joinNasPath,
    isArchiveStorageReady,
} from "@/lib/nas/synologyConfig";

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

    if (isArchiveStorageReady()) {
        await synologyEnsureFolder(nasPath);
    }

    const created = await prisma.archiveFolder.create({
        data: {
            kind: "customer",
            name: formatCompanyName(customer.name),
            slug,
            nasPath,
            customerId: customer.id,
        },
    });

    // Alleen bij nieuwe map: eerder gewist pad weer zichtbaar maken.
    await clearArchiveHiddenPath([created.name]).catch(() => {});

    return created;
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

    async function clearHiddenForLocation() {
        const tree = archiveWorkorderTree({
            customerName: customerFolder.name,
            locatieRaw,
            plaatsRaw,
        });

        await clearArchiveHiddenPath([
            ...tree.companies,
            tree.location,
        ]).catch(() => {});
        await clearArchiveHiddenPath([
            customerFolder.name,
            label,
        ]).catch(() => {});
    }

    if (existing) {
        await clearHiddenForLocation();
        return existing;
    }

    const nasPath = joinNasPath(customerFolder.nasPath, slug);

    if (isArchiveStorageReady()) {
        await synologyEnsureFolder(nasPath);
    }

    const created = await prisma.archiveFolder.create({
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

    await clearHiddenForLocation();

    return created;
}

export function projectArchiveLocationKey(projectId: string): string {
    return `project:${projectId}`;
}

export async function ensureProjectArchiveFolder(project: {
    id: string;
    number: string;
    name: string;
    customerId: string;
}) {
    const customerFolder = await ensureCustomerArchiveFolder(
        project.customerId
    );
    const locationKey = projectArchiveLocationKey(project.id);
    const name = `${project.number} ${project.name}`.trim();
    const slug = archiveSlug(name);

    const existing = await prisma.archiveFolder.findFirst({
        where: {
            kind: "project",
            customerId: project.customerId,
            locationKey,
        },
    });

    if (existing) {
        return existing;
    }

    const nasPath = await uniqueNasPath(
        joinNasPath(customerFolder.nasPath, slug)
    );

    if (isArchiveStorageReady()) {
        await synologyEnsureFolder(nasPath);
    }

    return prisma.archiveFolder.create({
        data: {
            kind: "project",
            name,
            slug,
            nasPath,
            customerId: project.customerId,
            locationKey,
            parentId: customerFolder.id,
        },
    });
}

export async function syncCompletedProjectArchiveFolders() {
    const projects = await prisma.project.findMany({
        where: { status: "afgerond" },
        select: {
            id: true,
            number: true,
            name: true,
            customerId: true,
        },
    });

    const folders = [];

    for (const project of projects) {
        folders.push(await ensureProjectArchiveFolder(project));
    }

    return folders;
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

    if (isArchiveStorageReady()) {
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

    // Herbouw van een eerder gewiste map → verborgen-markering opheffen.
    async function clearHiddenForFolder(folderName: string) {
        const ancestorNames: string[] = [];
        let cursor = parent;

        while (cursor) {
            ancestorNames.unshift(cursor.name);
            cursor = cursor.parentId
                ? await prisma.archiveFolder.findUnique({
                    where: { id: cursor.parentId },
                })
                : null;
        }

        await clearArchiveHiddenPath([...ancestorNames, folderName]).catch(
            () => {}
        );
    }

    if (existing) {
        await clearHiddenForFolder(existing.name);
        return existing;
    }

    const nasPath = await uniqueNasPath(
        joinNasPath(parent?.nasPath || defaultArchiveRoot(), slug)
    );

    if (isArchiveStorageReady()) {
        await synologyEnsureFolder(nasPath);
    }

    const created = await prisma.archiveFolder.create({
        data: {
            kind: opts.kind || (parent ? "custom" : "custom"),
            name,
            slug,
            nasPath,
            parentId: parent?.id ?? null,
        },
    });

    await clearHiddenForFolder(name);

    return created;
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

    if (isArchiveStorageReady() && folder.nasPath !== nextNasPath) {
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

/**
 * Map ophalen voor verwijderen.
 * Alle archiefmappen (incl. auto-gegenereerde opdracht-/locatiemappen) mogen weg.
 * De opdracht zelf blijft bestaan; alleen map + bestanden verdwijnen.
 */
export async function assertArchiveFolderDeletable(folderId: string) {
    const folder = await prisma.archiveFolder.findUnique({
        where: { id: folderId },
    });

    if (!folder) {
        throw new Error("Map niet gevonden");
    }

    return folder;
}

/** Verwijder een map inclusief submappen en bestanden (DB + NAS). */
export async function deleteArchiveFolder(folderId: string) {
    const folder = await assertArchiveFolderDeletable(folderId);

    const folders = await prisma.archiveFolder.findMany({
        where: {
            OR: [
                { id: folder.id },
                { nasPath: { startsWith: `${folder.nasPath}/` } },
            ],
        },
        select: { id: true },
    });

    const files = await prisma.archiveFile.findMany({
        where: { folderId: { in: folders.map((item) => item.id) } },
    });

    if (isArchiveStorageReady()) {
        for (const file of files) {
            if (file.storage === "nas") {
                await synologyDeleteFile(file.storagePath).catch(() => {});
            }
        }

        await synologyDeleteFile(folder.nasPath).catch(() => {});
    }

    await prisma.archiveFolder.delete({
        where: { id: folder.id },
    });

    return files;
}
