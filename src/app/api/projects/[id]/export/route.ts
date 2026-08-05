import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/guard";
import { buildProjectExportWorkbook } from "@/lib/projects/exportWorkbook";

export async function GET(
    request: Request,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    const guard = await requireApiUser();

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const { id } = await context.params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                customer: true,
                uren: {
                    orderBy: [{ datum: "asc" }, { createdAt: "asc" }],
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                        bookedBy: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                materialen: {
                    orderBy: { createdAt: "asc" },
                },
                workorders: {
                    orderBy: { createdAt: "asc" },
                    select: {
                        number: true,
                        title: true,
                        status: true,
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project niet gevonden" },
                { status: 404 }
            );
        }

        const buffer = await buildProjectExportWorkbook(project);

        const filename = `project-${project.number}.xlsx`;

        return new NextResponse(Buffer.from(buffer), {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("PROJECT EXPORT ERROR", error);

        return NextResponse.json(
            { error: "Export mislukt" },
            { status: 500 }
        );
    }
}
