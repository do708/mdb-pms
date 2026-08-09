import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/guard";
import { loadOfficeNotifications } from "@/lib/officeNotifications";

export async function GET() {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const items = await loadOfficeNotifications();

        return NextResponse.json({
            count: items.length,
            items,
        });
    } catch (error) {
        console.error("NOTIFICATIONS ERROR", error);

        return NextResponse.json(
            { error: "Meldingen ophalen mislukt" },
            { status: 500 }
        );
    }
}
