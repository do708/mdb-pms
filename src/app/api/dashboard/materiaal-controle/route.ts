import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { excludeArchivedWorkorders } from "@/lib/archive";
import {
    effectiefKlaarzetMateriaal,
    leesSchermAansturing,
    materiaalCompleet,
    materiaalRegels,
} from "@/lib/klaarzetMateriaal";

/** Ingeplande (nog uit te voeren) opdrachten met openstaand materiaal. */
export async function GET() {
    const guard = await requireApiRole(["admin", "office"]);
    if (!guard.ok) return guard.response;

    try {
        const workorders = await prisma.workorder.findMany({
            where: {
                status: "ingepland",
                ...excludeArchivedWorkorders(),
            },
            orderBy: [
                { plannedDate: "asc" },
                { number: "asc" },
            ],
            include: {
                customer: { select: { name: true } },
                project: {
                    include: {
                        customer: { select: { name: true } },
                    },
                },
                assignedUser: { select: { name: true } },
            },
        });

        const items = [];

        for (const w of workorders) {
            const aansturing = leesSchermAansturing(w.aanvraagSpecificaties);
            const km = effectiefKlaarzetMateriaal(
                w.formData,
                w.aanvraagSpecificaties
            );

            if (!km || materiaalCompleet(km, { heeftNativeOs: aansturing.heeftNativeOs })) {
                continue;
            }

            const regels = materiaalRegels(km, {
                heeftNativeOs: aansturing.heeftNativeOs,
            });
            const openRegels = regels.filter((r) => !r.inOrde);
            if (openRegels.length === 0) {
                continue;
            }

            const locatieDelen = [
                w.location,
                [w.straat, w.huisnummer].filter(Boolean).join(" ").trim(),
                [w.postcode, w.city].filter(Boolean).join(" ").trim(),
            ].filter((x) => typeof x === "string" && x.trim());

            items.push({
                id: w.id,
                number: w.number,
                title: w.title,
                plannedDate: w.plannedDate,
                customer:
                    w.customer?.name
                    ?? w.project?.customer?.name
                    ?? null,
                engineer: w.assignedUser?.name ?? null,
                locatie: locatieDelen.join(" · ") || null,
                regels: openRegels,
                alleRegels: regels,
                aansturing: aansturing.labels,
                heeftNativeOs: aansturing.heeftNativeOs,
            });
        }

        return NextResponse.json({ items, count: items.length });
    } catch (error) {
        console.error("MATERIAAL-CONTROLE API ERROR", error);
        return NextResponse.json(
            { error: "Materiaalcontrole ophalen mislukt" },
            { status: 500 }
        );
    }
}
