import { prisma } from "@/lib/prisma";

/** Koppel de gekozen formuliertypes aan de opdracht (vervangt de oude keuze). */
export async function syncWorkorderForms(
    workorderId: string,
    formTypeIds: unknown
) {
    if (!Array.isArray(formTypeIds)) {
        return;
    }

    const nextIds = [
        ...new Set(
            formTypeIds.filter(
                (value): value is string =>
                    typeof value === "string" && Boolean(value)
            )
        ),
    ];

    const existing = await prisma.workorderForm.findMany({
        where: { workorderId },
        select: { id: true, formTypeId: true },
    });

    const nextSet = new Set(nextIds);
    const teVerwijderen = existing.filter(
        (row) => !nextSet.has(row.formTypeId)
    );
    const bestaandeIds = new Set(existing.map((row) => row.formTypeId));
    const teMaken = nextIds.filter((id) => !bestaandeIds.has(id));

    if (teVerwijderen.length > 0) {
        await prisma.workorderForm.deleteMany({
            where: {
                id: { in: teVerwijderen.map((row) => row.id) },
            },
        });
    }

    for (const formTypeId of teMaken) {
        await prisma.workorderForm.create({
            data: {
                workorderId,
                formTypeId,
            },
        }).catch(() => {
            // ongeldige of dubbele koppeling negeren
        });
    }
}
