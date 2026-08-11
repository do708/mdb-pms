/**
 * Planningsconflicten: overlappende blokken voor dezelfde monteur
 * (opdracht ↔ opdracht, agenda ↔ opdracht, agenda ↔ agenda).
 */

import {
    formatAmsterdamDateIso,
    getAmsterdamParts,
} from "@/lib/datetime/amsterdam";

export type ConflictWorkorderInput = {
    id: string;
    number: string | null;
    title: string;
    plannedDate: Date | string | null;
    plannedEndDate?: Date | string | null;
    assignedUserId: string | null;
    assignedUser?: { name: string | null } | null;
};

export type ConflictAgendaInput = {
    id: string;
    title: string;
    startAt: Date | string;
    endAt?: Date | string | null;
    allDay?: boolean;
    assignedUserId?: string | null;
    assignedUser?: { id?: string; name: string | null } | null;
};

export type PlanningConflict = {
    /** Opdrachten onderling, agenda vs opdracht, of agenda onderling */
    type: "workorders" | "agenda_workorder" | "agenda";
    user: string;
    userId: string;
    date: string;
    dateIso: string;
    items: string[];
    workorderIds: string[];
    eventIds: string[];
};

type Block = {
    kind: "workorder" | "agenda";
    id: string;
    label: string;
    userId: string;
    userName: string;
    dateIso: string;
    startMs: number;
    endMs: number;
    /** Geen specifieke tijd → hele dag (conflict met elk ander blok die dag) */
    allDay: boolean;
};

function toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
}

/** Heeft de geplande start een wall-clock tijd (niet middernacht Amsterdam)? */
export function heeftPlanningTijd(date: Date): boolean {
    const p = getAmsterdamParts(date);
    return p.hour !== 0 || p.minute !== 0;
}

function formatNlConflictDate(dateIso: string): string {
    const [y, m, d] = dateIso.split("-").map(Number);
    const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return utcNoon.toLocaleDateString("nl-NL", {
        timeZone: "Europe/Amsterdam",
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

function intervalsOverlap(a: Block, b: Block): boolean {
    if (a.allDay || b.allDay) {
        return true;
    }
    return a.startMs < b.endMs && b.startMs < a.endMs;
}

function workorderBlocks(
    workorders: ConflictWorkorderInput[]
): Block[] {
    const out: Block[] = [];

    for (const wo of workorders) {
        if (!wo.assignedUserId || !wo.plannedDate) {
            continue;
        }

        const start = toDate(wo.plannedDate);
        const end = wo.plannedEndDate
            ? toDate(wo.plannedEndDate)
            : new Date(start.getTime() + 60 * 60 * 1000);
        const allDay = !heeftPlanningTijd(start);
        const num = wo.number ? `${wo.number} ` : "";

        out.push({
            kind: "workorder",
            id: wo.id,
            label: `${num}${wo.title}`.trim(),
            userId: wo.assignedUserId,
            userName: wo.assignedUser?.name ?? "Onbekend",
            dateIso: formatAmsterdamDateIso(start),
            startMs: start.getTime(),
            endMs: Math.max(end.getTime(), start.getTime() + 1),
            allDay,
        });
    }

    return out;
}

function agendaBlocks(events: ConflictAgendaInput[]): Block[] {
    const out: Block[] = [];

    for (const ev of events) {
        const userId =
            ev.assignedUserId ?? ev.assignedUser?.id ?? null;
        if (!userId) {
            continue;
        }

        const start = toDate(ev.startAt);
        const allDay = Boolean(ev.allDay) || !heeftPlanningTijd(start);
        const end = ev.endAt
            ? toDate(ev.endAt)
            : allDay
              ? start
              : new Date(start.getTime() + 60 * 60 * 1000);

        out.push({
            kind: "agenda",
            id: ev.id,
            label: `Agenda: ${ev.title}`,
            userId,
            userName: ev.assignedUser?.name ?? "Onbekend",
            dateIso: formatAmsterdamDateIso(start),
            startMs: start.getTime(),
            endMs: Math.max(end.getTime(), start.getTime() + 1),
            allDay,
        });
    }

    return out;
}

function conflictType(
    blocks: Block[]
): PlanningConflict["type"] {
    const hasWo = blocks.some((b) => b.kind === "workorder");
    const hasAg = blocks.some((b) => b.kind === "agenda");
    if (hasWo && hasAg) return "agenda_workorder";
    if (hasAg) return "agenda";
    return "workorders";
}

/**
 * Detecteer overlappende planning voor dezelfde monteur op dezelfde dag.
 */
export function detectPlanningConflicts(
    workorders: ConflictWorkorderInput[],
    events: ConflictAgendaInput[] = []
): PlanningConflict[] {
    const blocks = [
        ...workorderBlocks(workorders),
        ...agendaBlocks(events),
    ];

    const buckets = new Map<string, Block[]>();

    for (const block of blocks) {
        const key = `${block.userId}|${block.dateIso}`;
        const bucket = buckets.get(key) ?? [];
        bucket.push(block);
        buckets.set(key, bucket);
    }

    const conflicts: PlanningConflict[] = [];

    for (const bucket of buckets.values()) {
        if (bucket.length < 2) {
            continue;
        }

        // Union-find: componenten van overlappende blokken
        const parent = bucket.map((_, i) => i);
        function find(i: number): number {
            while (parent[i] !== i) {
                parent[i] = parent[parent[i]];
                i = parent[i];
            }
            return i;
        }
        function union(a: number, b: number) {
            const ra = find(a);
            const rb = find(b);
            if (ra !== rb) parent[ra] = rb;
        }

        for (let i = 0; i < bucket.length; i++) {
            for (let j = i + 1; j < bucket.length; j++) {
                if (intervalsOverlap(bucket[i], bucket[j])) {
                    union(i, j);
                }
            }
        }

        const components = new Map<number, Block[]>();
        for (let i = 0; i < bucket.length; i++) {
            const root = find(i);
            const list = components.get(root) ?? [];
            list.push(bucket[i]);
            components.set(root, list);
        }

        for (const group of components.values()) {
            if (group.length < 2) {
                continue;
            }

            const first = group[0];
            conflicts.push({
                type: conflictType(group),
                user: first.userName,
                userId: first.userId,
                date: formatNlConflictDate(first.dateIso),
                dateIso: first.dateIso,
                items: group.map((b) => b.label),
                workorderIds: group
                    .filter((b) => b.kind === "workorder")
                    .map((b) => b.id),
                eventIds: group
                    .filter((b) => b.kind === "agenda")
                    .map((b) => b.id),
            });
        }
    }

    conflicts.sort((a, b) => {
        if (a.dateIso !== b.dateIso) {
            return a.dateIso.localeCompare(b.dateIso);
        }
        return a.user.localeCompare(b.user, "nl");
    });

    return conflicts;
}

/** Compat: oude clients verwachten `workorders` als label-array. */
export function conflictsForApi(
    conflicts: PlanningConflict[]
): Array<PlanningConflict & { workorders: string[] }> {
    return conflicts.map((c) => ({
        ...c,
        workorders: c.items,
    }));
}
