import { prisma } from "@/lib/prisma";

type FormDataObject = Record<string, unknown>;

function asObject(value: unknown): FormDataObject {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return { ...(value as FormDataObject) };
    }

    return {};
}

export function pakbonUrlFromFormData(formData: unknown): string {
    const km = asObject(asObject(formData).klaarzetMateriaal);
    return typeof km.pakbonUrl === "string" ? km.pakbonUrl : "";
}

export async function attachPakbonUrlToWorkorder(
    workorderId: string,
    url: string
) {
    const workorder = await prisma.workorder.findUnique({
        where: { id: workorderId },
        select: { formData: true },
    });

    if (!workorder) {
        throw new Error("Opdracht niet gevonden");
    }

    const next = asObject(workorder.formData);
    const km = asObject(next.klaarzetMateriaal);

    next.klaarzetMateriaal = {
        ...km,
        pakbonUrl: url,
    };

    await prisma.workorder.update({
        where: { id: workorderId },
        data: { formData: JSON.parse(JSON.stringify(next)) },
    });
}

export type PakbonRecordInput = {
    url: string;
    originalName?: string | null;
    filename?: string | null;
    contentType?: string | null;
};

export async function createPakbonForWorkorders(
    workorderIds: string[],
    file: PakbonRecordInput
) {
    const uniqueIds = [...new Set(workorderIds)];

    const pakbon = await prisma.pakbon.create({
        data: {
            url: file.url,
            originalName: file.originalName || null,
            filename: file.filename || null,
            contentType: file.contentType || null,
            workorders: {
                create: uniqueIds.map((workorderId) => ({ workorderId })),
            },
        },
    });

    for (const id of uniqueIds) {
        await attachPakbonUrlToWorkorder(id, file.url);
    }

    return pakbon;
}

export async function linkPakbonToWorkorders(
    pakbonId: string,
    workorderIds: string[]
) {
    const pakbon = await prisma.pakbon.findUnique({
        where: { id: pakbonId },
        select: { id: true, url: true },
    });

    if (!pakbon) {
        throw new Error("Pakbon niet gevonden");
    }

    const uniqueIds = [...new Set(workorderIds)];

    await prisma.pakbonWorkorder.createMany({
        data: uniqueIds.map((workorderId) => ({
            pakbonId,
            workorderId,
        })),
        skipDuplicates: true,
    });

    for (const id of uniqueIds) {
        await attachPakbonUrlToWorkorder(id, pakbon.url);
    }

    return pakbon;
}

export function pakbonViewUrl(workorderId: string, pakbonId: string) {
    return `/api/workorders/${workorderId}/pakbon?pakbonId=${encodeURIComponent(pakbonId)}`;
}

export function serializePakbonLinks(
    workorderId: string,
    links: {
        pakbon: {
            id: string;
            originalName: string | null;
            filename: string | null;
            createdAt: Date;
        };
    }[]
) {
    return links.map((link) => ({
        id: link.pakbon.id,
        originalName: link.pakbon.originalName,
        filename: link.pakbon.filename,
        createdAt: link.pakbon.createdAt,
        viewUrl: pakbonViewUrl(workorderId, link.pakbon.id),
    }));
}
