import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/projects/budget";

export async function projectSummaries(where: object = {}) {
    const projects = await prisma.project.findMany({
        where,
        include: {
            customer: true,
            uren: {
                select: {
                    uren: true,
                },
            },
            materialen: {
                select: {
                    kosten: true,
                },
            },
            _count: {
                select: {
                    workorders: true,
                    uren: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return projects.map((p) => {
        const gebruikteUren = p.uren.reduce(
            (sum, row) => sum + decimalToNumber(row.uren),
            0
        );

        const materiaalKosten = p.materialen.reduce(
            (sum, row) => sum + decimalToNumber(row.kosten),
            0
        );

        return {
            id: p.id,
            number: p.number,
            name: p.name,
            location: p.location,
            status: p.status,
            customer: p.customer,
            geoffreerdeUren: decimalToNumber(p.geoffreerdeUren),
            geoffreerdBedrag: decimalToNumber(p.geoffreerdBedrag),
            offerteUrl: p.offerteUrl,
            offerteFilename: p.offerteFilename,
            createdAt: p.createdAt,
            gebruikteUren,
            materiaalKosten,
            workorderCount: p._count.workorders,
            urenRegelCount: p._count.uren,
        };
    });
}

export function serializeProjectDetail(
    project: Awaited<ReturnType<typeof loadProjectDetail>>
) {
    if (!project) {
        return null;
    }

    const gebruikteUren = project.uren.reduce(
        (sum, row) => sum + decimalToNumber(row.uren),
        0
    );

    const materiaalKosten = project.materialen.reduce(
        (sum, row) => sum + decimalToNumber(row.kosten),
        0
    );

    return {
        id: project.id,
        number: project.number,
        name: project.name,
        location: project.location,
        status: project.status,
        customerId: project.customerId,
        customer: project.customer,
        geoffreerdeUren: decimalToNumber(project.geoffreerdeUren),
        geoffreerdBedrag: decimalToNumber(project.geoffreerdBedrag),
        offerteUrl: project.offerteUrl,
        offerteFilename: project.offerteFilename,
        createdAt: project.createdAt,
        gebruikteUren,
        materiaalKosten,
        uren: project.uren.map((row) => ({
            id: row.id,
            datum: row.datum,
            uren: decimalToNumber(row.uren),
            omschrijving: row.omschrijving,
            kilometers: row.kilometers,
            createdAt: row.createdAt,
            user: row.user,
        })),
        materialen: project.materialen.map((row) => ({
            id: row.id,
            omschrijving: row.omschrijving,
            factuurnummer: row.factuurnummer,
            leverancier: row.leverancier,
            kosten: decimalToNumber(row.kosten),
            ingekochtOp: row.ingekochtOp,
            createdAt: row.createdAt,
        })),
        workorders: project.workorders.map((w) => ({
            id: w.id,
            number: w.number,
            title: w.title,
            status: w.status,
        })),
    };
}

export async function loadProjectDetail(id: string) {
    return prisma.project.findUnique({
        where: { id },
        include: {
            customer: true,
            uren: {
                orderBy: [{ datum: "desc" }, { createdAt: "desc" }],
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
            materialen: {
                orderBy: { createdAt: "desc" },
            },
            workorders: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    status: true,
                },
            },
        },
    });
}
