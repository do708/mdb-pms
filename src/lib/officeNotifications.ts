import { prisma } from "@/lib/prisma";
import { volgendeWerkdag } from "@/lib/holidays";
import {
    leesKlaarzetMateriaal,
    heeftMateriaal,
    materiaalCompleet,
    leesSchermAansturing,
} from "@/lib/klaarzetMateriaal";
import { loadUpcomingPlanningConflicts } from "@/lib/planning/loadUpcomingConflicts";
import { loadForgottenProjectHours } from "@/lib/projects/forgottenHours";
import type { OfficeNotification } from "@/lib/officeNotificationTypes";

const NOG_IN_TE_VULLEN = ["ontvangen", "afspraak", "ingepland"] as const;

export interface OfficeNotificationCounters {
    openAanvragen: number;
    openForms: number;
    teLaat: number;
    materiaal: number;
    planningsconflicten: number;
    nietGereed: number;
    projectUrenVergeten: number;
}

export interface NietGereedMelding {
    id: string;
    title: string;
    message: string | null;
    workorderId: string | null;
    createdAt: Date;
}

/** Zelfde filter als de alarmbel: volgende werkdag, nog in te vullen, materiaal open. */
export interface MateriaalKlaarzettenItem {
    id: string;
    number: string;
    title: string;
    plannedDate: Date | null;
    customer: string | null;
    engineer: string | null;
}

export async function loadNietGereedMeldingen(): Promise<NietGereedMelding[]> {
    return safe(
        "niet-gereed",
        () =>
            prisma.notification.findMany({
                where: {
                    type: "niet_gereed",
                    read: false,
                },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    message: true,
                    workorderId: true,
                    createdAt: true,
                },
            }),
        []
    );
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

function volgendeWerkdagVenster(vanaf: Date): { start: Date; eind: Date } {
    const start = new Date(vanaf);
    start.setDate(start.getDate() + 1);
    const volgWerkdag = volgendeWerkdag(vanaf);
    const eind = new Date(volgWerkdag);
    eind.setDate(eind.getDate() + 1);
    return { start, eind };
}

function isMateriaalKlaarzettenOpen(
    formData: unknown,
    aanvraagSpecificaties: unknown
): boolean {
    try {
        const km = leesKlaarzetMateriaal(formData);
        const aansturing = leesSchermAansturing(aanvraagSpecificaties);
        return Boolean(
            heeftMateriaal(km)
            && !materiaalCompleet(km, { heeftNativeOs: aansturing.heeftNativeOs })
        );
    } catch (error) {
        console.error("OFFICE NOTIFICATIONS (materiaal-check)", error);
        return false;
    }
}

export async function loadMateriaalKlaarzettenUrgent(): Promise<
    MateriaalKlaarzettenItem[]
> {
    const { start, eind } = volgendeWerkdagVenster(startOfToday());

    const kandidaten = await safe(
        "materiaal-kandidaten",
        () =>
            prisma.workorder.findMany({
                where: {
                    plannedDate: {
                        gte: start,
                        lt: eind,
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
    );

    const items: MateriaalKlaarzettenItem[] = [];
    for (const w of kandidaten) {
        if (!isMateriaalKlaarzettenOpen(w.formData, w.aanvraagSpecificaties)) {
            continue;
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
        });
    }
    return items;
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

    const [
        aanvragen,
        formulieren,
        teLaat,
        materiaalUrgent,
        conflicten,
        nietGereed,
        vergetenProjectUren,
    ] =
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

            loadMateriaalKlaarzettenUrgent(),

            safe("planningsconflicten", () => loadUpcomingPlanningConflicts(), []),

            loadNietGereedMeldingen(),

            safe("projecturen-vergeten", () => loadForgottenProjectHours(), []),
        ]);

    const materiaalItems: OfficeNotification[] = materiaalUrgent.map((w) => ({
        id: `materiaal-${w.id}`,
        soort: "materiaal",
        title: `${w.number} — ${w.title}`,
        subtitle: `Materiaal controleren · ${w.customer ?? "—"} · gepland ${nlDate(w.plannedDate)}`,
        href: `/workorders/${w.id}/edit`,
    }));

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

        ...nietGereed.map((n): OfficeNotification => ({
            id: n.id,
            soort: "niet_gereed",
            title: n.title,
            subtitle: n.message || "Opnieuw inplannen",
            href: n.workorderId ? `/workorders/${n.workorderId}` : "/dashboard",
        })),

        ...conflicten.map((c, index): OfficeNotification => ({
            id: `conflict-${c.userId}-${c.dateIso}-${index}`,
            soort: "planningsconflict",
            title: c.user,
            subtitle: `${c.date} · ${c.items.join(" ↔ ")}`,
            href: "/planning",
        })),

        ...vergetenProjectUren.map((row): OfficeNotification => ({
            id: `projecturen-${row.id}`,
            soort: "projecturen",
            title: `${row.userName} — uren niet geboekt`,
            subtitle: `${row.projectNumber} · ${row.projectName} · ${nlDate(row.dateIso)}`,
            href: `/projects/${row.projectId}`,
        })),
    ];

    const counters: OfficeNotificationCounters = {
        openAanvragen: aanvragen.length,
        openForms: formulieren.length,
        teLaat: teLaat.length,
        materiaal: materiaalItems.length,
        planningsconflicten: conflicten.length,
        nietGereed: nietGereed.length,
        projectUrenVergeten: vergetenProjectUren.length,
    };

    const count =
        counters.openAanvragen
        + counters.openForms
        + counters.teLaat
        + counters.materiaal
        + counters.planningsconflicten
        + counters.nietGereed
        + counters.projectUrenVergeten;

    return { items, counters, count };
}
