import { prisma } from "@/lib/prisma";
import { volgendeWerkdag } from "@/lib/holidays";
import {
    leesKlaarzetMateriaal,
    heeftMateriaal,
    materiaalCompleet,
} from "@/lib/klaarzetMateriaal";
import type { OfficeNotification } from "@/lib/officeNotificationTypes";

const NOG_IN_TE_VULLEN = ["ontvangen", "afspraak", "ingepland"] as const;

function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function nlDate(value: Date | string | null | undefined): string {
    if (!value) return "—";
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("nl-NL");
}

/** Alle openstaande kantoormeldingen (bel + dashboard). */
export async function loadOfficeNotifications(): Promise<OfficeNotification[]> {
    const startVandaag = startOfToday();

    const startMorgen = new Date(startVandaag);
    startMorgen.setDate(startMorgen.getDate() + 1);

    const volgWerkdag = volgendeWerkdag(startVandaag);
    const eindMorgen = new Date(volgWerkdag);
    eindMorgen.setDate(eindMorgen.getDate() + 1);

    const [aanvragen, formulieren, teLaat, morgenKlussen] = await Promise.all([
        prisma.aanvraag.findMany({
            where: { status: "open" },
            orderBy: { createdAt: "desc" },
            include: {
                customer: { select: { name: true } },
            },
        }),

        prisma.formSubmission.findMany({
            where: { status: "ingediend" },
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true } },
            },
        }),

        prisma.workorder.findMany({
            where: {
                plannedDate: { lt: startVandaag },
                status: { in: [...NOG_IN_TE_VULLEN] },
            },
            orderBy: { plannedDate: "asc" },
            include: {
                customer: { select: { name: true } },
                project: {
                    include: {
                        customer: { select: { name: true } },
                    },
                },
                assignedUser: { select: { name: true } },
            },
        }),

        prisma.workorder.findMany({
            where: {
                plannedDate: {
                    gte: startMorgen,
                    lt: eindMorgen,
                },
                status: { in: [...NOG_IN_TE_VULLEN] },
            },
            orderBy: { plannedDate: "asc" },
            include: {
                customer: { select: { name: true } },
                project: {
                    include: {
                        customer: { select: { name: true } },
                    },
                },
                assignedUser: { select: { name: true } },
            },
        }),
    ]);

    const materiaal = morgenKlussen
        .filter((w) => {
            const km = leesKlaarzetMateriaal(w.formData);
            return heeftMateriaal(km) && !materiaalCompleet(km);
        })
        .map((w): OfficeNotification => {
            const klant =
                w.customer?.name ??
                w.project?.customer?.name ??
                "—";
            return {
                id: `materiaal-${w.id}`,
                soort: "materiaal",
                title: `${w.number} — ${w.title}`,
                subtitle: `Materiaal controleren · ${klant} · gepland ${nlDate(w.plannedDate)}`,
                href: `/workorders/${w.id}/edit`,
            };
        });

    return [
        ...aanvragen.map((a): OfficeNotification => {
            const locatie = [a.locatie, a.plaats].filter(Boolean).join(" · ");
            return {
                id: `aanvraag-${a.id}`,
                soort: "aanvraag",
                title: `Aanvraag · ${a.customer.name}`,
                subtitle: locatie || "Nieuwe opdrachtgeveraanvraag",
                href: "/dashboard",
            };
        }),

        ...formulieren.map((f): OfficeNotification => ({
            id: `formulier-${f.id}`,
            soort: "formulier",
            title: f.title,
            subtitle: `${f.user?.name ?? "Onbekend"} · ${nlDate(f.createdAt)}`,
            href: `/forms/${f.id}`,
        })),

        ...teLaat.map((w): OfficeNotification => {
            const klant =
                w.customer?.name ??
                w.project?.customer?.name ??
                "—";
            return {
                id: `telaat-${w.id}`,
                soort: "telaat",
                title: `${w.number} — ${w.title}`,
                subtitle: `${w.assignedUser?.name ?? "Geen monteur"} · ${klant} · gepland ${nlDate(w.plannedDate)}`,
                href: `/workorders/${w.id}`,
            };
        }),

        ...materiaal,
    ];
}
