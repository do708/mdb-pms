import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/projects/budget";

export async function projectSummaries(
    where: object = {},
    options: { forEngineer?: boolean } = {}
) {
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

        if (options.forEngineer) {
            return {
                id: p.id,
                number: p.number,
                name: p.name,
                location: p.location,
                plaats: p.plaats,
                status: p.status,
                customer: {
                    id: p.customer.id,
                    name: p.customer.name,
                    color: p.customer.color,
                },
                geoffreerdeUren: 0,
                geoffreerdBedrag: 0,
                offerteUrl: null,
                offerteFilename: null,
                createdAt: p.createdAt,
                gebruikteUren,
                materiaalKosten: 0,
                workorderCount: p._count.workorders,
                urenRegelCount: p._count.uren,
            };
        }

        return {
            id: p.id,
            number: p.number,
            name: p.name,
            location: p.location,
            plaats: p.plaats,
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
    project: Awaited<ReturnType<typeof loadProjectDetail>>,
    options: { forEngineer?: boolean } = {}
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

    const uren = project.uren.map((row) => ({
        id: row.id,
        datum: row.datum,
        uren: decimalToNumber(row.uren),
        omschrijving: row.omschrijving,
        kilometers: row.kilometers,
        createdAt: row.createdAt,
        user: row.user,
        bookedBy: row.bookedBy,
    }));

    if (options.forEngineer) {
        return {
            id: project.id,
            number: project.number,
            name: project.name,
            location: project.location,
            plaats: project.plaats,
            status: project.status,
            customerId: project.customerId,
            customer: {
                id: project.customer.id,
                name: project.customer.name,
            },
            geoffreerdeUren: 0,
            geoffreerdBedrag: 0,
            offerteUrl: null,
            offerteFilename: null,
            termijn1Gefactureerd: false,
            termijn2Gefactureerd: false,
            termijn3Gefactureerd: false,
            termijn4Gefactureerd: false,
            termijn1GefactureerdOp: null,
            termijn2GefactureerdOp: null,
            termijn3GefactureerdOp: null,
            termijn4GefactureerdOp: null,
            createdAt: project.createdAt,
            gebruikteUren,
            materiaalKosten: 0,
            uren,
            materialen: [],
            workorders: [],
        };
    }

    return {
        id: project.id,
        number: project.number,
        name: project.name,
        location: project.location,
        plaats: project.plaats,
        status: project.status,
        customerId: project.customerId,
        customer: project.customer,
        geoffreerdeUren: decimalToNumber(project.geoffreerdeUren),
        geoffreerdBedrag: decimalToNumber(project.geoffreerdBedrag),
        offerteUrl: project.offerteUrl,
        offerteFilename: project.offerteFilename,
        termijn1Gefactureerd: Boolean(project.termijn1Gefactureerd),
        termijn2Gefactureerd: Boolean(project.termijn2Gefactureerd),
        termijn3Gefactureerd: Boolean(project.termijn3Gefactureerd),
        termijn4Gefactureerd: Boolean(project.termijn4Gefactureerd),
        termijn1GefactureerdOp: project.termijn1GefactureerdOp,
        termijn2GefactureerdOp: project.termijn2GefactureerdOp,
        termijn3GefactureerdOp: project.termijn3GefactureerdOp,
        termijn4GefactureerdOp: project.termijn4GefactureerdOp,
        createdAt: project.createdAt,
        gebruikteUren,
        materiaalKosten,
        uren,
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
                    bookedBy: {
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
