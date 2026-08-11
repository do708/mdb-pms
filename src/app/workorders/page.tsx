"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DeleteButton from "@/components/DeleteButton";
import { PlanningStatusIcon, WorkorderStatusIconLegend } from "@/components/planning/PlanningStatusIcon";
import { getStatus, migrateStatus, WORKORDER_STATUSES } from "@/constants/workorderStatus";
import {
    PageHeader,
    PageShell,
    SpecFieldLabel,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
    specInputClassName,
    specSelectClassName,
} from "@/components/ui/SpecLayout";

interface Workorder {
    id: string;
    number: string;
    title: string;
    status: string;
    location: string | null;
    customer: {
        name: string;
    } | null;
    project: {
        name: string;
        customer: {
            name: string;
        };
    } | null;
    assignedUser?: {
        name: string | null;
    } | null;
    _count?: {
        photos?: number;
    };
}

export default function WorkordersPage() {
    const { data: session } = useSession();

    const role = session?.user?.role || "";

    const canCreateWorkorder = role === "admin" || role === "office";

    const [workorders, setWorkorders] = useState<Workorder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("alle");

    async function load() {
        const response = await fetch("/api/workorders");
        const data = await response.json();
        setWorkorders(data);
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    if (loading) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Opdrachten laden...</p>
            </PageShell>
        );
    }

    const filtered = workorders.filter((workorder) => {
        const matchesSearch =
            workorder.number.toLowerCase().includes(search.toLowerCase()) ||
            workorder.title.toLowerCase().includes(search.toLowerCase()) ||
            (workorder.customer?.name ?? workorder.project?.customer.name ?? "—")
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesStatus =
            status === "alle" || workorder.status === status;

        return matchesSearch && matchesStatus;
    });

    return (
        <PageShell>
            <PageHeader
                title="Opdrachten"
                subtitle="Overzicht alle werkzaamheden"
                actions={
                    canCreateWorkorder ? (
                        <Link
                            href="/workorders/new"
                            className="
                                bg-[#d6007e] text-white
                                px-5 py-3 rounded-xl font-bold
                            "
                        >
                            + Nieuwe opdracht
                        </Link>
                    ) : undefined
                }
            />

            <SpecPanel title="Filters" tone="slate">
                <label className="block">
                    <SpecFieldLabel>Zoeken</SpecFieldLabel>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Zoek opdracht, klant of project"
                        className={specInputClassName}
                    />
                </label>

                <WorkorderStatusIconLegend />

                <label className="block">
                    <SpecFieldLabel>Status</SpecFieldLabel>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className={specSelectClassName}
                    >
                        <option value="alle">Alle statussen</option>
                        {WORKORDER_STATUSES.map((item) => (
                            <option key={item.key} value={item.key}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </label>
            </SpecPanel>

            <SpecPageCard>
                {filtered.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Geen opdrachten gevonden.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((workorder) => (
                            <SpecListRow
                                key={workorder.id}
                                className="
                                    flex flex-col gap-3
                                    sm:flex-row sm:items-start sm:justify-between
                                "
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-sm">
                                            {workorder.number}
                                        </span>
                                        <span
                                            className={`
                                                inline-flex items-center gap-1.5
                                                px-2 py-0.5 rounded-full text-xs
                                                ${getStatus(migrateStatus(workorder.status)).badge}
                                            `}
                                        >
                                            <PlanningStatusIcon
                                                status={workorder.status}
                                                className="h-3.5 w-3.5"
                                            />
                                            {
                                                getStatus(
                                                    migrateStatus(workorder.status)
                                                ).label
                                            }
                                        </span>
                                    </div>

                                    <p className="text-sm truncate">
                                        {workorder.title}
                                    </p>

                                    <p className="text-xs text-gray-500 truncate">
                                        🏢{" "}
                                        {workorder.customer?.name ??
                                            workorder.project?.customer.name ??
                                            "—"}
                                        {" · 📍 "}
                                        {workorder.location ??
                                            workorder.project?.name ??
                                            "—"}
                                        {" · 👷 "}
                                        {workorder.assignedUser?.name ||
                                            "Geen monteur"}
                                    </p>
                                </div>

                                <div
                                    className="
                                        flex flex-wrap gap-2 items-center
                                        sm:justify-end sm:max-w-[min(100%,22rem)]
                                    "
                                >
                                    <Link
                                        href={`/workorders/${workorder.id}`}
                                        title="Opdracht openen"
                                        className="
                                            bg-[#d6007e] text-white
                                            px-3 py-1.5 rounded-lg
                                            text-sm font-semibold
                                        "
                                    >
                                        Openen
                                    </Link>

                                    <a
                                        href={`/api/workorders/${workorder.id}/pdf`}
                                        title="PDF download"
                                        className="
                                            border border-gray-200
                                            px-3 py-1.5 rounded-lg text-sm
                                            text-gray-700 hover:bg-gray-50
                                        "
                                    >
                                        PDF
                                    </a>

                                    {(role === "admin" || role === "office") && (
                                        <>
                                            <a
                                                href={`/api/workorders/${workorder.id}/photos/zip`}
                                                title="Download alle foto's van de werkbon (.zip)"
                                                className="
                                                    border border-gray-200
                                                    px-3 py-1.5 rounded-lg text-sm
                                                    text-gray-700 hover:bg-gray-50
                                                "
                                            >
                                                .zip
                                            </a>

                                            <DeleteButton
                                                url={`/api/workorders/${workorder.id}`}
                                                label={`Opdracht ${workorder.number}`}
                                                onDeleted={load}
                                                compact
                                                title="Prullenbak"
                                            />
                                        </>
                                    )}
                                </div>
                            </SpecListRow>
                        ))}
                    </div>
                )}
            </SpecPageCard>
        </PageShell>
    );
}
