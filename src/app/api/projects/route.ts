import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { requireApiUser } from "@/lib/auth/guard";
import { projectSummaries } from "@/lib/projects/serialize";

function generateProjectNumber() {
    const year = new Date().getFullYear();

    const random = Math.floor(Math.random() * 9000) + 1000;

    return `PR-${year}-${random}`;
}

export async function GET() {
    try {
        const guard = await requireApiUser();

        if (!guard.ok) {
            return guard.response;
        }

        const engineerFilter =
            guard.user.role === "engineer"
                ? {
                      status: {
                          in: ["actief", "new"],
                      },
                  }
                : {};

        const projects = await projectSummaries(engineerFilter, {
            forEngineer: guard.user.role === "engineer",
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error("PROJECTS GET ERROR", error);

        return NextResponse.json(
            {
                error: "Projecten ophalen mislukt",
            },
            {
                status: 500,
            }
        );
    }
}

export async function POST(request: Request) {
    try {
        const guard = await requireApiRole(["admin", "office"]);

        if (!guard.ok) {
            return guard.response;
        }

        const body = await request.json();

        if (!body.name || !body.customerId) {
            return NextResponse.json(
                { error: "Naam en opdrachtgever zijn verplicht" },
                { status: 400 }
            );
        }

        const project = await prisma.project.create({
            data: {
                number: generateProjectNumber(),
                name: body.name,
                location: body.location || null,
                plaats: body.plaats || null,
                customerId: body.customerId,
                geoffreerdeUren:
                    body.geoffreerdeUren != null &&
                    body.geoffreerdeUren !== ""
                        ? body.geoffreerdeUren
                        : null,
                geoffreerdBedrag:
                    body.geoffreerdBedrag != null &&
                    body.geoffreerdBedrag !== ""
                        ? body.geoffreerdBedrag
                        : null,
                status: body.status ?? "actief",
            },
            include: {
                customer: true,
            },
        });

        return NextResponse.json(project, {
            status: 201,
        });
    } catch (error) {
        console.error("PROJECT CREATE ERROR", error);

        return NextResponse.json(
            {
                error: "Project aanmaken mislukt",
            },
            {
                status: 500,
            }
        );
    }
}
