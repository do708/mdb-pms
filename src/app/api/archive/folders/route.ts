import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/guard";
import { assignedToEngineer } from "@/lib/archive";
import { syncAllCustomerArchiveFolders } from "@/lib/archive/ensureArchiveFolders";

export async function GET() {
    const guard = await requireApiUser();

    if (!guard.ok) {
        return guard.response;
    }

    try {
        await syncAllCustomerArchiveFolders();

        const isEngineer = guard.user.role === "engineer";
        const assignedWhere = isEngineer
            ? assignedToEngineer(guard.user.id)
            : undefined;

        const customers = await prisma.archiveFolder.findMany({
            where: { kind: "customer" },
            orderBy: { name: "asc" },
            include: {
                children: {
                    where: { kind: "location" },
                    orderBy: { name: "asc" },
                    include: {
                        children: {
                            where: {
                                kind: "workorder",
                                ...(assignedWhere
                                    ? { workorder: assignedWhere }
                                    : {}),
                            },
                            orderBy: { name: "desc" },
                            include: {
                                workorder: {
                                    select: {
                                        id: true,
                                        number: true,
                                        title: true,
                                        status: true,
                                        archivedAt: true,
                                        archiveStatus: true,
                                        archiveNasPath: true,
                                        plannedDate: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: { children: true },
                        },
                    },
                },
            },
        });

        const folders = customers
            .map((customer) => ({
                ...customer,
                children: customer.children.filter(
                    (location) => !isEngineer || location.children.length > 0
                ),
            }))
            .filter((customer) => customer.children.length > 0);

        return NextResponse.json({ folders });
    } catch (error) {
        console.error("ARCHIVE FOLDERS ERROR", error);

        return NextResponse.json(
            { error: "Archiefmappen ophalen mislukt" },
            { status: 500 }
        );
    }
}
