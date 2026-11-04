"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    PageHeader,
    PageShell,
    SpecListRow,
    SpecPageCard,
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

export default function MagazijnDashboard() {
    const [klussen, setKlussen] = useState<Klus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const response = await fetch("/api/pakbonnen");
            if (response.ok) {
                const data = await response.json();
                setKlussen(data.workorders ?? []);
            }
            setLoading(false);
        })();
    }, []);

    return (
        <PageShell>
            <PageHeader
                title="Magazijn"
                subtitle="Bekijk geplande klussen en upload pakbonnen."
                actions={
                    <Link
                        href="/pakbonnen"
                        className="bg-[#d6007e] text-white px-5 py-3 rounded-xl font-semibold"
                    >
                        Pakbon uploaden
                    </Link>
                }
            />

            <SpecPageCard>
                <h2 className="font-semibold text-sm text-gray-800">
                    Open klussen
                </h2>
                {loading ? (
                    <p className="text-sm text-gray-500">Laden…</p>
                ) : klussen.length === 0 ? (
                    <p className="text-sm text-gray-400">Geen open klussen.</p>
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
