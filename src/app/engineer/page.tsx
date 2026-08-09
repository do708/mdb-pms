"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    PageHeader,
    PageShell,
    SpecPanel,
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
                title="👷 Monteur omgeving"
                subtitle="Mijn geplande werkzaamheden"
            />

            <div className="space-y-4">
                {workorders.length === 0 && (
                    <SpecPanel>
                        <p className="text-sm text-gray-700">
                            Geen geplande opdrachten
                        </p>
                    </SpecPanel>
                )}

                {workorders.map((item) => (
                    <div
                        key={item.id}
                        className="rounded-xl border-l-8"
                        style={{
                            borderLeftColor:
                                item.project?.customer?.color || "#000000",
                        }}
                    >
                        <SpecPanel className="!rounded-l-none border-l-0 !p-5">
                            <h2 className="text-xl font-bold">{item.number}</h2>

                            <p>{item.title}</p>

                            <p className="mt-2">
                                🏢{" "}
                                {item.customer?.name ||
                                    item.project?.customer?.name ||
                                    "Geen klant"}
                            </p>

                            <p>
                                📁{" "}
                                {item.project?.name ||
                                    item.title ||
                                    "Geen project"}
                            </p>

                            <p>Status: {item.status}</p>

                            <p>
                                👷{" "}
                                {item.assignedUser?.name || "Niet toegewezen"}
                            </p>

                            <Link
                                href={`/engineer/workorders/${item.id}`}
                                className="
                                    flex items-center justify-center
                                    w-full mt-4
                                    bg-[#d6007e] text-white
                                    px-4 py-4 min-h-[48px]
                                    rounded-xl font-bold text-base
                                "
                            >
                                Open opdracht
                            </Link>
                        </SpecPanel>
                    </div>
                ))}
            </div>
        </PageShell>
    );
}
