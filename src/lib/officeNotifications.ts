import { prisma } from "@/lib/prisma";
import { volgendeWerkdag } from "@/lib/holidays";
import {
    leesKlaarzetMateriaal,
    heeftMateriaal,
    materiaalCompleet,
    leesSchermAansturing,
} from "@/lib/klaarzetMateriaal";
import { loadUpcomingPlanningConflicts } from "@/lib/planning/loadUpcomingConflicts";
import type { OfficeNotification } from "@/lib/officeNotificationTypes";

const NOG_IN_TE_VULLEN = ["ontvangen", "afspraak", "ingepland"] as const;

export interface OfficeNotificationCounters {
    openAanvragen: number;
    openForms: number;
    teLaat: number;
    materiaal: number;
    planningsconflicten: number;
}

export interface OfficeNotificationsPayload {
    items: OfficeNotification[];
    counters: OfficeNotificationCounters;
    count: number;
}

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

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        console.error(`OFFICE NOTIFICATIONS (${label})`, error);
        return fallback;
    }
}

/** Alle openstaande kantoormeldingen (bel + dashboard-tellers). */
export async function loadOfficeNotifications(): Promise<OfficeNotificationsPayload> {
    const startVandaag = startOfToday();

    const startMorgen = new Date(startVandaag);
    startMorgen.setDate(startMorgen.getDate() + 1);

    const volgWerkdag = volgendeWerkdag(startVandaag);
    const eindMorgen = new Date(volgWerkdag);
    eindMorgen.setDate(eindMorgen.getDate() + 1);

    const [aanvragen, formulieren, teLaat, morgenKlussen, conflicten] =
        await Promise.all([
            safe(
                "aanvragen",
                () =>
                    prisma.aanvraag.findMany({
                        where: { status: "open" },
                        orderBy: { createdAt: "desc" },
                        include: {
                            customer: { select: { name: true } },
                        },
                    }),
                []
            ),

            safe(
                "formulieren",
                () =>
                    prisma.formSubmission.findMany({
                        where: { status: "ingediend" },
                        orderBy: { createdAt: "desc" },
                        include: {
                            user: { select: { name: true } },
                        },
                    }),
                []
            ),

            safe(
                "telaat",
                () =>
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
                []
            ),

            safe(
                "materiaal-kandidaten",
                () =>
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
                []
            ),

            safe("planningsconflicten", () => loadUpcomingPlanningConflicts(), []),
        ]);

    const materiaalItems: OfficeNotification[] = [];
    for (const w of morgenKlussen) {
        try {
            const km = leesKlaarzetMateriaal(w.formData);
            const aansturing = leesSchermAansturing(w.aanvraagSpecificaties);
            if (!(heeftMateriaal(km) && !materiaalCompleet(km, { heeftNativeOs: aansturing.heeftNativeOs }))) {
                continue;
            }
            const klant =
                w.customer?.name ??
                w.project?.customer?.name ??
                "—";
            materiaalItems.push({
                id: `materiaal-${w.id}`,
                soort: "materiaal",
                title: `${w.number} — ${w.title}`,
                subtitle: `Materiaal controleren · ${klant} · gepland ${nlDate(w.plannedDate)}`,
                href: `/workorders/${w.id}/edit`,
            });
        } catch (error) {
            console.error("OFFICE NOTIFICATIONS (materiaal-item)", w.id, error);
        }
    }

    const items: OfficeNotification[] = [
        ...aanvragen.map((a): OfficeNotification => {
            const locatie = [a.locatie, a.plaats].filter(Boolean).join(" · ");
            return {
                id: `aanvraag-${a.id}`,
                soort: "aanvraag",
                title: `Aanvraag · ${a.customer?.name ?? "Opdrachtgever"}`,
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

        ...materiaalItems,

        ...conflicten.map((c, index): OfficeNotification => ({
            id: `conflict-${c.userId}-${c.dateIso}-${index}`,
            soort: "planningsconflict",
            title: c.user,
            subtitle: `${c.date} · ${c.items.join(" ↔ ")}`,
            href: "/planning",
        })),
    ];

    const counters: OfficeNotificationCounters = {
        openAanvragen: aanvragen.length,
        openForms: formulieren.length,
        teLaat: teLaat.length,
        materiaal: materiaalItems.length,
        planningsconflicten: conflicten.length,
    };

    const count =
        counters.openAanvragen
        + counters.openForms
        + counters.teLaat
        + counters.materiaal
        + counters.planningsconflicten;

    return { items, counters, count };
}
