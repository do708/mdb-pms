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

export default function EngineerPage() {
    const [workorders, setWorkorders] = useState<EngineerWorkorder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const response = await fetch("/api/engineer");
            const data = await response.json();

            if (Array.isArray(data)) {
                setWorkorders(data);
            }

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

    return (
        <PageShell className="-m-2 sm:-m-0">
            <PageHeader
                title="Mijn opdrachten"
                subtitle="Geplande werkzaamheden"
            />

            <SpecPageCard>
                {workorders.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Geen geplande opdrachten.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {workorders.map((item) => {
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
                                    <div
                                        className="
                                            flex flex-col gap-3 px-3 py-2.5
                                            sm:flex-row sm:items-center
                                            sm:justify-between
                                        "
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="font-bold text-sm text-gray-900">
                                                    {item.number}
                                                </h2>
                                                <span
                                                    className={`
                                                        px-2 py-0.5 rounded-full text-xs
                                                        ${getStatus(item.status).badge}
                                                    `}
                                                >
                                                    {
                                                        getStatus(item.status)
                                                            .label
                                                    }
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-800 mt-0.5">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {opdrachtgever}
                                                {item.project?.name
                                                    ? ` · ${item.project.name}`
                                                    : ""}
                                                {item.assignedUser?.name
                                                    ? ` · ${item.assignedUser.name}`
                                                    : ""}
                                            </p>
                                        </div>

                                        <Link
                                            href={`/engineer/workorders/${item.id}`}
                                            className="
                                                shrink-0 inline-flex justify-center
                                                bg-[#d6007e] text-white
                                                px-4 py-2.5 rounded-xl
                                                text-sm font-semibold
                                            "
                                        >
                                            Open opdracht
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </SpecPageCard>
        </PageShell>
    );
}
