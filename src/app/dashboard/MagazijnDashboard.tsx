"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    PageHeader,
    PageShell,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
} from "@/components/ui/SpecLayout";

interface Klus {
    id: string;
    number: string;
    title: string;
    plannedDate: string | null;
    city: string | null;
    customer: { name: string } | null;
    assignedUser: { name: string | null } | null;
}

interface MateriaalItem {
    id: string;
    number: string;
    title: string;
    plannedDate: string | null;
    customer: string | null;
    engineer: string | null;
}

function nlDate(value: string | null): string {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("nl-NL");
}

export default function MagazijnDashboard() {
    const [klussen, setKlussen] = useState<Klus[]>([]);
    const [materiaal, setMateriaal] = useState<MateriaalItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const [pakbonRes, dashRes] = await Promise.all([
                fetch("/api/pakbonnen"),
                fetch("/api/dashboard"),
            ]);
            if (pakbonRes.ok) {
                const data = await pakbonRes.json();
                setKlussen(data.workorders ?? []);
            }
            if (dashRes.ok) {
                const data = await dashRes.json();
                setMateriaal(data.materiaalWaarschuwing ?? []);
            }
            setLoading(false);
        })();
    }, []);

    return (
        <PageShell>
            <PageHeader
                title="Magazijn"
                subtitle="Klussen zonder pakbon. Upload één pakbon en koppel die aan een of meer klussen."
                actions={
                    <Link
                        href="/pakbonnen"
                        className="bg-[#d6007e] text-white px-5 py-3 rounded-xl font-semibold"
                    >
                        Pakbon uploaden
                    </Link>
                }
            />

            {materiaal.length > 0 && (
                <SpecPanel
                    title={`Materiaal klaarzetten (${materiaal.length})`}
                    hint="Opdrachten voor de volgende werkdag waarvan het materiaal nog klaargezet moet worden."
                    tone="amber"
                >
                    <div className="space-y-2">
                        {materiaal.map((workorder) => (
                            <SpecListRow
                                key={workorder.id}
                                className="flex justify-between items-center gap-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 truncate">
                                        {workorder.number} — {workorder.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                        {workorder.customer ?? "—"}
                                        {workorder.engineer
                                            ? ` · ${workorder.engineer}`
                                            : ""}
                                        {workorder.plannedDate
                                            ? ` · gepland ${nlDate(workorder.plannedDate)}`
                                            : ""}
                                    </p>
                                </div>
                            </SpecListRow>
                        ))}
                    </div>
                </SpecPanel>
            )}

            <SpecPageCard>
                <h2 className="font-semibold text-sm text-gray-800">
                    Open klussen zonder pakbon
                </h2>
                {loading ? (
                    <p className="text-sm text-gray-500">Laden…</p>
                ) : klussen.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        Geen klussen zonder pakbon.
                    </p>
                ) : (
                    <div className="space-y-1">
                        {klussen.slice(0, 30).map((klus) => (
                            <SpecListRow key={klus.id}>
                                <p className="text-sm font-medium truncate">
                                    {klus.number} — {klus.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {klus.customer?.name ?? "—"}
                                    {klus.city ? ` · ${klus.city}` : ""}
                                    {klus.assignedUser?.name
                                        ? ` · ${klus.assignedUser.name}`
                                        : ""}
                                    {klus.plannedDate
                                        ? ` · ${new Date(
                                              klus.plannedDate
                                          ).toLocaleDateString("nl-NL")}`
                                        : ""}
                                </p>
                            </SpecListRow>
                        ))}
                    </div>
                )}
            </SpecPageCard>
        </PageShell>
    );
}
