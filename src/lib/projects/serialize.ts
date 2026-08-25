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
                bunniOfferteNummer: null,
                bunniFactuurNummer: null,
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
            bunniOfferteNummer: p.bunniOfferteNummer,
            bunniFactuurNummer: p.bunniFactuurNummer,
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

    const bijlagen = (project.bijlagen ?? []).map((row) => ({
        id: row.id,
        url: row.url,
        filename: row.filename,
        originalName: row.originalName,
        contentType: row.contentType,
        createdAt: row.createdAt,
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
            bunniOfferteId: null,
            bunniOfferteNummer: null,
            bunniOffertePdfUrl: null,
            bunniFactuurId: null,
            bunniFactuurNummer: null,
            bunniFactuurPdfUrl: null,
            termijn1Gefactureerd: false,
            termijn2Gefactureerd: false,
            termijn3Gefactureerd: false,
            termijn4Gefactureerd: false,
            termijn1GefactureerdOp: null,
            termijn2GefactureerdOp: null,
            termijn3GefactureerdOp: null,
            termijn4GefactureerdOp: null,
            termijn1Factuurnummer: null,
            termijn2Factuurnummer: null,
            termijn3Factuurnummer: null,
            termijn4Factuurnummer: null,
            createdAt: project.createdAt,
            gebruikteUren,
            materiaalKosten: 0,
            uren,
            bijlagen,
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
        bunniOfferteId: project.bunniOfferteId,
        bunniOfferteNummer: project.bunniOfferteNummer,
        bunniOffertePdfUrl: project.bunniOffertePdfUrl,
        bunniFactuurId: project.bunniFactuurId,
        bunniFactuurNummer: project.bunniFactuurNummer,
        bunniFactuurPdfUrl: project.bunniFactuurPdfUrl,
        // Gefactureerd = er is een factuurdatum; leeg blijft uitgevinkt.
        termijn1Gefactureerd: project.termijn1GefactureerdOp != null,
        termijn2Gefactureerd: project.termijn2GefactureerdOp != null,
        termijn3Gefactureerd: project.termijn3GefactureerdOp != null,
        termijn4Gefactureerd: project.termijn4GefactureerdOp != null,
        termijn1GefactureerdOp: project.termijn1GefactureerdOp ?? null,
        termijn2GefactureerdOp: project.termijn2GefactureerdOp ?? null,
        termijn3GefactureerdOp: project.termijn3GefactureerdOp ?? null,
        termijn4GefactureerdOp: project.termijn4GefactureerdOp ?? null,
        termijn1Factuurnummer: project.termijn1Factuurnummer ?? null,
        termijn2Factuurnummer: project.termijn2Factuurnummer ?? null,
        termijn3Factuurnummer: project.termijn3Factuurnummer ?? null,
        termijn4Factuurnummer: project.termijn4Factuurnummer ?? null,
        createdAt: project.createdAt,
        gebruikteUren,
        materiaalKosten,
        uren,
        bijlagen,
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

function isMissingProjectAttachmentTable(error: unknown): boolean {
    const code =
        error && typeof error === "object" && "code" in error
            ? String((error as { code: unknown }).code)
            : "";
    const message =
        error instanceof Error ? error.message : String(error ?? "");

    return (
        code === "P2021"
        || (
            /projectattachment/i.test(message)
            && /does not exist|niet bestaan|unknown arg/i.test(message)
        )
    );
}

const projectDetailInclude = {
    customer: true,
    uren: {
        orderBy: [{ datum: "desc" as const }, { createdAt: "desc" as const }],
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
        orderBy: { createdAt: "desc" as const },
    },
    workorders: {
        orderBy: { createdAt: "desc" as const },
        select: {
            id: true,
            number: true,
            title: true,
            status: true,
        },
    },
};

export async function loadProjectDetail(id: string) {
    try {
        return await prisma.project.findUnique({
            where: { id },
            include: {
                ...projectDetailInclude,
                bijlagen: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });
    } catch (error) {
        if (!isMissingProjectAttachmentTable(error)) {
            throw error;
        }

        console.warn(
            "PROJECT ATTACHMENT TABLE MISSING — voer prisma migrate deploy uit"
        );

        const project = await prisma.project.findUnique({
            where: { id },
            include: projectDetailInclude,
        });

        if (!project) {
            return null;
        }

        return {
            ...project,
            bijlagen: [],
        };
    }
}
