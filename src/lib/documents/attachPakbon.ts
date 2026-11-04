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
