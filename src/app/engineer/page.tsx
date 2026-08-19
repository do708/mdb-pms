"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStatus } from "@/constants/workorderStatus";
import {
    PageHeader,
    PageShell,
    SpecPageCard,
} from "@/components/ui/SpecLayout";

interface EngineerWorkorder {
    id: string;
    number: string;
    title: string;
    status: string;
    plannedDate: string | null;
    customer?: {
        name: string;
        color?: string | null;
    } | null;
    project?: {
        name: string;
        customer?: {
            name: string;
            color?: string | null;
        } | null;
    } | null;
    assignedUser?: {
        name: string | null;
    } | null;
}

function toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDayLabel(dateStr: string): { label: string; overdue: boolean } {
    const today = new Date();
    const todayKey = toDateKey(today);

    if (dateStr === todayKey) return { label: "Vandaag", overdue: false };
    if (dateStr < todayKey) {
        const d = new Date(dateStr + "T00:00:00");
        const dag = d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
        return { label: dag.charAt(0).toUpperCase() + dag.slice(1), overdue: true };
    }
    return { label: dateStr, overdue: false };
}

export default function EngineerPage() {
    const [workorders, setWorkorders] = useState<EngineerWorkorder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const response = await fetch("/api/engineer");
            const data = await response.json();
            if (Array.isArray(data)) setWorkorders(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Opdrachten laden…</p>
            </PageShell>
        );
    }

    const grouped = new Map<string, EngineerWorkorder[]>();
    for (const wo of workorders) {
        const key = wo.plannedDate ? wo.plannedDate.slice(0, 10) : "geen-datum";
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(wo);
    }
    const sortedKeys = [...grouped.keys()].sort();

    return (
        <PageShell className="-m-2 sm:-m-0">
            <PageHeader
                title="Mijn opdrachten"
                subtitle="Werkbonnen die nog ingevuld moeten worden"
            />

            {workorders.length === 0 ? (
                <SpecPageCard>
                    <p className="text-sm text-gray-500">
                        Geen openstaande opdrachten.
                    </p>
                </SpecPageCard>
            ) : (
                <div className="space-y-4">
                    {sortedKeys.map((dateKey) => {
                        const items = grouped.get(dateKey)!;
                        const { label, overdue } = dateKey === "geen-datum"
                            ? { label: "Zonder datum", overdue: true }
                            : formatDayLabel(dateKey);

                        return (
                            <div key={dateKey}>
                                <div className="flex items-center gap-2 mb-2 px-1">
                                    <h2 className={
                                        "text-sm font-semibold " +
                                        (overdue ? "text-orange-600" : "text-gray-800")
                                    }>
                                        {label}
                                    </h2>
                                    {overdue && (
                                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                                            Achterstallig
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">
                                        {items.length} {items.length === 1 ? "opdracht" : "opdrachten"}
                                    </span>
                                </div>

                                <SpecPageCard>
                                    <div className="space-y-2">
                                        {items.map((item) => {
                                            const kleur =
                                                item.project?.customer?.color ||
                                                item.customer?.color ||
                                                "#d1d5db";
                                            const opdrachtgever =
                                                item.customer?.name ||
                                                item.project?.customer?.name ||
                                                "—";

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="rounded-lg border border-gray-200 bg-white border-l-4"
                                                    style={{ borderLeftColor: kleur }}
                                                >
                                                    <div className="flex flex-col gap-3 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className="font-bold text-sm text-gray-900">
                                                                    {item.number}
                                                                </h3>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatus(item.status).badge}`}>
                                                                    {getStatus(item.status).label}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-800 mt-0.5">
                                                                {item.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                                {opdrachtgever}
                                                                {item.project?.name ? ` · ${item.project.name}` : ""}
                                                                {item.assignedUser?.name ? ` · ${item.assignedUser.name}` : ""}
                                                            </p>
                                                        </div>

                                                        <Link
                                                            href={`/engineer/workorders/${item.id}`}
                                                            className="shrink-0 inline-flex justify-center bg-[#d6007e] text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
                                                        >
                                                            Open werkbon
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </SpecPageCard>
                            </div>
                        );
                    })}
                </div>
            )}
        </PageShell>
    );
}
