import { prisma } from "@/lib/prisma";
import { archiveSlug, formatCompanyName } from "@/lib/archive/formatArchiveLocationName";
import {
    defaultArchiveRoot,
    synologyEnsureFolder,
    synologyListFiles,
} from "@/lib/nas/synologyClient";
import {
    isArchiveStorageReady,
    joinNasPath,
} from "@/lib/nas/synologyConfig";

/**
 * Lees mappen van de NAS (of lokale mount) en zorg dat ze in de DB staan,
 * zodat ze in sidebar → Archief verschijnen.
 */
export async function syncArchiveFoldersFromNas(maxDepth = 4) {
    if (!isArchiveStorageReady()) {
        return { imported: 0, skipped: true as const };
    }

    const root = defaultArchiveRoot();
    await synologyEnsureFolder(root);

    let imported = 0;

    async function walk(nasPath: string, parentId: string | null, depth: number) {
        if (depth > maxDepth) {
            return;
        }

        const entries = await synologyListFiles(nasPath);
        const dirs = entries.filter((entry) => entry.isDir);

        for (const dir of dirs) {
            const existing = await prisma.archiveFolder.findUnique({
                where: { nasPath: dir.path },
                select: { id: true },
            });

            let folderId = existing?.id ?? null;

            if (!existing) {
                const name = formatCompanyName(dir.name);
                const slug = archiveSlug(name);
                const siblingSlugTaken = await prisma.archiveFolder.findFirst({
                    where: parentId
                        ? { parentId, slug }
                        : { parentId: null, slug },
                    select: { id: true },
                });

                const uniqueSlug = siblingSlugTaken
                    ? `${slug}-${Date.now().toString(36)}`
                    : slug;

                const created = await prisma.archiveFolder.create({
                    data: {
                        kind: "custom",
                        name,
                        slug: uniqueSlug,
                        nasPath: dir.path,
                        parentId,
                    },
                });

                folderId = created.id;
                imported += 1;
            }

            if (folderId) {
                await walk(dir.path, folderId, depth + 1);
            }
        }
    }

    await walk(root, null, 0);

    // Losse bestanden in de archief-root als ArchiveFile onder een virtuele
    // root-map is niet nodig; alleen mappen verschijnen in de boom.

    return { imported, skipped: false as const, root: joinNasPath(root) };
}
