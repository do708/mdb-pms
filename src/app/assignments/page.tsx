"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    PageHeader,
    PageShell,
    SpecListRow,
    SpecPageCard,
} from "@/components/ui/SpecLayout";

interface Assignment {
    id: string;
    number: string;
    title: string;
    type: string;
    status: string;
    plannedDate: string | null;
    customer: {
        name: string;
    };
    users: {
        user: {
            name: string | null;
        };
    }[];
}

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const response = await fetch("/api/assignments");
            const data = await response.json();

            setAssignments(data);
            setLoading(false);
        }

        load();
    }, []);

    return (
        <PageShell>
            <PageHeader
                title="Opdrachten"
                subtitle="Opnames, installaties, onderhoud en projecten"
            />

            <SpecPageCard>
                {loading ? (
                    <p className="text-sm text-gray-500">Laden...</p>
                ) : assignments.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Geen opdrachten gevonden.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {assignments.map((assignment) => (
                            <Link
                                key={assignment.id}
                                href={`/assignments/${assignment.id}`}
                                className="block"
                            >
                                <SpecListRow
                                    className="
                                        flex flex-col gap-2
                                        sm:flex-row sm:items-center
                                        sm:justify-between
                                        hover:bg-gray-50
                                    "
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-sm text-gray-900">
                                                {assignment.number}
                                            </span>
                                            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                                                {assignment.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-800 mt-0.5">
                                            {assignment.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                            {assignment.customer.name}
                                            {" · "}
                                            {assignment.type}
                                            {" · "}
                                            {assignment.plannedDate
                                                ? new Date(
                                                      assignment.plannedDate
                                                  ).toLocaleDateString("nl-NL")
                                                : "Nog niet gepland"}
                                            {" · "}
                                            {assignment.users.length > 0
                                                ? assignment.users
                                                      .map((x) => x.user.name)
                                                      .filter(Boolean)
                                                      .join(", ")
                                                : "Geen monteur"}
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium text-sky-700 shrink-0">
                                        Bekijk opdracht →
                                    </span>
                                </SpecListRow>
                            </Link>
                        ))}
                    </div>
                )}
            </SpecPageCard>
        </PageShell>
    );
}
