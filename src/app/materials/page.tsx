"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    PageHeader,
    PageShell,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
    specInputClassName,
} from "@/components/ui/SpecLayout";

interface MaterialItem {
    id: string;
    name: string;
    articleNumber: string | null;
    quantity: number;
    unit: string | null;
    note: string | null;
    createdAt: string;
    workorder: {
        id: string;
        number: string;
        title: string;
        project: {
            name: string;
            customer: {
                name: string;
            };
        };
    };
}

interface Totals {
    key: string;
    name: string;
    articleNumber: string | null;
    unit: string | null;
    total: number;
    workorders: number;
}

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function load() {
            const response = await fetch("/api/materials");
            const data = await response.json();

            setMaterials(Array.isArray(data) ? data : []);
            setLoading(false);
        }

        load();
    }, []);

    if (loading) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Materialen laden...</p>
            </PageShell>
        );
    }

    const filtered = materials.filter((item) => {
        if (!search) {
            return true;
        }

        const term = search.toLowerCase();

        return (
            item.name.toLowerCase().includes(term) ||
            (item.articleNumber ?? "").toLowerCase().includes(term) ||
            item.workorder.number.toLowerCase().includes(term)
        );
    });

    // Verbruik optellen per materiaal (naam + artikelnummer)
    const totalsMap = new Map<string, Totals>();

    for (const item of filtered) {
        const key = `${item.name}|${item.articleNumber ?? ""}`;
        const existing = totalsMap.get(key);

        if (existing) {
            existing.total += item.quantity;
            existing.workorders += 1;
        } else {
            totalsMap.set(key, {
                key,
                name: item.name,
                articleNumber: item.articleNumber,
                unit: item.unit,
                total: item.quantity,
                workorders: 1,
            });
        }
    }

    const totals = Array.from(totalsMap.values()).sort(
        (a, b) => b.total - a.total
    );

    return (
        <PageShell>
            <PageHeader
                title="Materialen"
                subtitle="Materiaalverbruik uit opdrachten"
            />

            <SpecPageCard>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Zoek op naam, artikelnummer of opdracht..."
                    className={`${specInputClassName} max-w-md`}
                />

                <SpecPanel title="📦 Verbruik per materiaal" tone="slate">
                    {totals.length === 0 && (
                        <p className="text-sm text-gray-500">
                            Nog geen materialen geregistreerd.
                        </p>
                    )}

                    {totals.length > 0 && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b">
                                    <th className="py-2">Materiaal</th>
                                    <th className="py-2">Artikelnr</th>
                                    <th className="py-2 text-right">Totaal</th>
                                    <th className="py-2 text-right">
                                        Opdrachten
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {totals.map((item) => (
                                    <tr key={item.key} className="border-b">
                                        <td className="py-2">{item.name}</td>
                                        <td className="py-2 text-gray-500">
                                            {item.articleNumber || "-"}
                                        </td>
                                        <td className="py-2 text-right">
                                            {item.total} {item.unit || ""}
                                        </td>
                                        <td className="py-2 text-right">
                                            {item.workorders}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </SpecPanel>

                <SpecPanel title="🧾 Recente registraties">
                    {filtered.length === 0 && (
                        <p className="text-sm text-gray-500">
                            Geen materialen gevonden.
                        </p>
                    )}

                    <div className="space-y-2">
                        {filtered.slice(0, 50).map((item) => (
                            <Link
                                key={item.id}
                                href={`/workorders/${item.workorder.id}`}
                                className="block"
                            >
                                <SpecListRow className="hover:bg-gray-50">
                                    <div className="flex justify-between">
                                        <strong>{item.name}</strong>
                                        <span>
                                            {item.quantity} {item.unit || ""}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {item.workorder.number}
                                        {" · "}
                                        {item.workorder.project.customer.name}
                                        {" · "}
                                        {item.workorder.project.name}
                                    </p>
                                    {item.note && (
                                        <p className="text-sm text-gray-400">
                                            {item.note}
                                        </p>
                                    )}
                                </SpecListRow>
                            </Link>
                        ))}
                    </div>
                </SpecPanel>
            </SpecPageCard>
        </PageShell>
    );
}
