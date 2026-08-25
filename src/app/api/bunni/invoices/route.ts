import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/guard";
import {
    isBunniConfigured,
    listBunniDocuments,
    searchBunniDocuments,
} from "@/lib/bunni/client";

export async function GET(request: Request) {
    const guard = await requireApiRole(["admin", "office"]);

    if (!guard.ok) {
        return guard.response;
    }

    if (!isBunniConfigured()) {
        return NextResponse.json(
            { error: "Bunni API-key ontbreekt. Zet BUNNI_API_KEY in de omgeving." },
            { status: 503 }
        );
    }

    try {
        const url = new URL(request.url);
        const q = url.searchParams.get("q") || "";
        const kindParam = url.searchParams.get("kind");
        const kind =
            kindParam === "offerte" || kindParam === "factuur"
                ? kindParam
                : "alle";

        const items = await listBunniDocuments();
        const results = searchBunniDocuments(items, q, kind);

        return NextResponse.json({ items: results });
    } catch (error) {
        console.error("BUNNI LIST ERROR", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Bunni ophalen mislukt",
            },
            { status: 502 }
        );
    }
}
