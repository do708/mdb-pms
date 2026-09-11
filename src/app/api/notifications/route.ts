import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { loadOfficeNotifications } from "@/lib/officeNotifications";

export async function GET() {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const payload = await loadOfficeNotifications();

        return NextResponse.json(payload);
    } catch (error) {
        console.error("NOTIFICATIONS ERROR", error);

        return NextResponse.json(
            { error: "Meldingen ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const body = await request.json() as { id?: unknown };
        const id = typeof body.id === "string" ? body.id.trim() : "";

        if (!id) {
            return NextResponse.json(
                { error: "Melding ontbreekt" },
                { status: 400 }
            );
        }

        await prisma.notification.updateMany({
            where: {
                id,
                type: "niet_gereed",
            },
            data: { read: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("NOTIFICATIONS PATCH ERROR", error);

        return NextResponse.json(
            { error: "Melding bijwerken mislukt" },
            { status: 500 }
        );
    }
}

