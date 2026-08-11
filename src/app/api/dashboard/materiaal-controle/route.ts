import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { excludeArchivedWorkorders } from "@/lib/archive";
import {
    effectiefKlaarzetMateriaal,
    leesSchermAansturing,
    materiaalRegels,
    moetOpMateriaalControle,
    zetKlaarzetStatus,
    type KlaarzetStatusField,
    type MateriaalSoortKey,
} from "@/lib/klaarzetMateriaal";
import { mergeOpleverData } from "@/types/oplever";

const SOORT_KEYS:readonly MateriaalSoortKey[] = [
    "schermen",
    "players",
    "beugels",
    "kiosk",
    "versterkers",
];

const STATUS_FIELDS:readonly KlaarzetStatusField[] = [
    "geleverd",
    "geprepareerd",
    "klaargezet",
    "opLocatie",
];

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
            // formData + specificaties nodig voor controle; pdfData niet
            omit: {
                pdfData: true,
            },
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
            if (!moetOpMateriaalControle(w.formData, w.aanvraagSpecificaties)) {
                continue;
            }

            const km = effectiefKlaarzetMateriaal(
                w.formData,
                w.aanvraagSpecificaties
            );
            const regels = materiaalRegels(km, {
                heeftNativeOs: aansturing.heeftNativeOs,
            });
            const openRegels = regels.filter((r) => !r.inOrde);

            const straatHuis = [w.straat, w.huisnummer]
                .filter(Boolean)
                .join(" ")
                .trim();
            const postcodePlaats = [w.postcode, w.city]
                .filter(Boolean)
                .join(" ")
                .trim();
            const location =
                typeof w.location === "string" ? w.location.trim() : "";

            // location is vaak gelijk aan straat+huisnummer — geen dubbele regel.
            const locatieDelen: string[] = [];
            if (straatHuis) {
                locatieDelen.push(straatHuis);
                if (
                    location
                    && location.toLowerCase() !== straatHuis.toLowerCase()
                ) {
                    locatieDelen.unshift(location);
                }
            } else if (location) {
                locatieDelen.push(location);
            }
            if (postcodePlaats) {
                locatieDelen.push(postcodePlaats);
            }

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

/**
 * Sla één statusvinkje op in formData.klaarzetMateriaal.
 * Hergebruikt dezelfde formData-merge als de werkbon-PUT.
 */
export async function PATCH(request: Request) {
    const guard = await requireApiRole(["admin", "office"]);
    if (!guard.ok) return guard.response;

    try {
        const body = await request.json();
        const workorderId =
            typeof body?.workorderId === "string" ? body.workorderId : "";
        const regelKey = body?.regelKey as MateriaalSoortKey;
        const field = body?.field as KlaarzetStatusField;
        const value = Boolean(body?.value);

        if (
            !workorderId
            || !SOORT_KEYS.includes(regelKey)
            || !STATUS_FIELDS.includes(field)
        ) {
            return NextResponse.json(
                { error: "Ongeldige aanvraag" },
                { status: 400 }
            );
        }

        const workorder = await prisma.workorder.findUnique({
            where: { id: workorderId },
            select: {
                id: true,
                formData: true,
                aanvraagSpecificaties: true,
            },
        });

        if (!workorder) {
            return NextResponse.json(
                { error: "Opdracht niet gevonden" },
                { status: 404 }
            );
        }

        const bestaand =
            effectiefKlaarzetMateriaal(
                workorder.formData,
                workorder.aanvraagSpecificaties
            ) || {};

        const bijgewerkt = zetKlaarzetStatus(
            bestaand,
            regelKey,
            field,
            value
        );

        if (!bijgewerkt) {
            return NextResponse.json(
                { error: "Dit vinkje geldt niet voor deze materiaalregel" },
                { status: 400 }
            );
        }

        const bestaandeForm =
            workorder.formData
            && typeof workorder.formData === "object"
            && !Array.isArray(workorder.formData)
                ? (workorder.formData as Record<string, unknown>)
                : {};

        const formData = mergeOpleverData({
            ...bestaandeForm,
            klaarzetMateriaal: bijgewerkt,
        });

        await prisma.workorder.update({
            where: { id: workorderId },
            data: { formData: formData as object },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("MATERIAAL-CONTROLE PATCH ERROR", error);
        return NextResponse.json(
            { error: "Opslaan mislukt" },
            { status: 500 }
        );
    }
}
