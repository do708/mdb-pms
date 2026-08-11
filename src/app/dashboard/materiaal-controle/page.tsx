"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { canAccessOffice } from "@/lib/auth/checkRole";
import {
    PageHeader,
    PageShell,
    SpecPageCard,
    SpecPanel,
} from "@/components/ui/SpecLayout";

interface MateriaalRegel {
    key: string;
    label: string;
    aantal: string;
    geleverd: boolean;
    klaargezet: boolean;
    opLocatie: boolean;
    inOrde: boolean;
}

interface ControleItem {
    id: string;
    number: string;
    title: string;
    plannedDate: string | null;
    customer: string | null;
    engineer: string | null;
    locatie: string | null;
    regels: MateriaalRegel[];
    alleRegels: MateriaalRegel[];
    aansturing: string[];
    heeftNativeOs: boolean;
}

function nlDate(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("nl-NL", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function CheckBox({
    checked,
    label,
}: {
    checked: boolean;
    label: string;
}) {
    return (
        <span
            className={`
                inline-flex items-center gap-1.5 text-xs
                ${checked ? "text-emerald-800" : "text-gray-700"}
            `}
        >
            <span
                className={`
                    inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center
                    border border-gray-400 rounded-[2px] text-[10px] leading-none
                    ${checked ? "bg-emerald-100 border-emerald-500 text-emerald-800" : "bg-white"}
                `}
                aria-hidden
            >
                {checked ? "✓" : ""}
            </span>
            {label}
        </span>
    );
}

/** Lege print-checkbox om met pen af te vinken. */
function PrintTick({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-800">
            <span
                className="
                    inline-block h-3.5 w-3.5 shrink-0
                    border border-gray-500 rounded-[2px] bg-white
                "
                aria-hidden
            />
            {label}
        </span>
    );
}

export default function MateriaalControlePage() {
    const { data: session, status } = useSession();
    const userRole = session?.user?.role ?? "";
    const [items, setItems] = useState<ControleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/dashboard/materiaal-controle");
                const data = await res.json();
                if (!res.ok || data?.error) {
                    setError(data?.error || "Laden mislukt");
                    setItems([]);
                } else {
                    setItems(Array.isArray(data.items) ? data.items : []);
                }
            } catch {
                setError("Laden mislukt");
                setItems([]);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    if (status !== "loading" && !canAccessOffice(userRole)) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Geen toegang</p>
            </PageShell>
        );
    }

    if (loading) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">
                    Materiaalcontrole laden...
                </p>
            </PageShell>
        );
    }

    return (
        <PageShell className="print:p-0 print:space-y-3">
            <div className="print:hidden">
                <PageHeader
                    title="Materiaal controleren"
                    subtitle="Ingeplande klussen waarbij materiaal nog geleverd of klaargezet moet worden"
                    actions={
                        <>
                            <Link
                                href="/dashboard"
                                className="
                                    inline-flex items-center rounded-lg border
                                    border-gray-200 bg-white px-3 py-2
                                    text-sm font-medium text-gray-700
                                    hover:bg-gray-50
                                "
                            >
                                ← Dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="
                                    inline-flex items-center rounded-lg
                                    bg-[#0066FF] px-3 py-2
                                    text-sm font-semibold text-white
                                    hover:bg-[#0052cc]
                                "
                            >
                                Afdrukken
                            </button>
                        </>
                    }
                />
            </div>

            {/* Printkop */}
            <div className="hidden print:block mb-4">
                <h1 className="text-xl font-bold text-gray-900">
                    Materiaal controleren
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                    Afgedrukt{" "}
                    {new Date().toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                    {" · "}
                    {items.length}{" "}
                    {items.length === 1 ? "klus" : "klussen"} open
                </p>
            </div>

            {error ? (
                <p className="text-sm text-red-600 print:hidden">{error}</p>
            ) : null}

            {!error && items.length === 0 ? (
                <SpecPageCard className="print:border-0 print:shadow-none">
                    <p className="text-sm text-gray-600">
                        Geen openstaand materiaal bij ingeplande klussen.
                        Alles is geleverd/klaargezet of op locatie.
                    </p>
                </SpecPageCard>
            ) : null}

            <div className="space-y-4 print:space-y-3">
                {items.map((item) => (
                    <article
                        key={item.id}
                        className="
                            rounded-xl border border-gray-200 bg-white p-4
                            space-y-3 break-inside-avoid
                            print:border-gray-400 print:rounded-none
                            print:p-3 print:shadow-none
                        "
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 space-y-0.5">
                                <h2 className="font-semibold text-sm text-gray-900">
                                    {item.number} — {item.title}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {item.customer ?? "—"}
                                    {item.engineer
                                        ? ` · ${item.engineer}`
                                        : ""}
                                    {" · "}
                                    Gepland: {nlDate(item.plannedDate)}
                                </p>
                                {item.locatie ? (
                                    <p className="text-xs text-gray-500">
                                        {item.locatie}
                                    </p>
                                ) : null}
                                {item.aansturing.length > 0 ? (
                                    <p className="text-xs text-gray-600">
                                        Aansturing:{" "}
                                        {item.aansturing.join(", ")}
                                    </p>
                                ) : null}
                            </div>
                            <Link
                                href={`/workorders/${item.id}/edit`}
                                className="
                                    print:hidden shrink-0 text-xs font-medium
                                    text-[#0066FF] hover:underline
                                "
                            >
                                Werkbon openen →
                            </Link>
                        </div>

                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500">
                                    <th className="py-1.5 pr-2 font-medium">
                                        Materiaal
                                    </th>
                                    <th className="py-1.5 pr-2 font-medium">
                                        Omschrijving
                                    </th>
                                    <th className="py-1.5 font-medium">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {item.alleRegels.map((regel) => (
                                    <tr
                                        key={regel.key}
                                        className="border-b border-gray-100 last:border-0 align-top"
                                    >
                                        <td className="py-2 pr-2 font-semibold text-gray-800 whitespace-nowrap">
                                            {regel.label}
                                        </td>
                                        <td className="py-2 pr-2 text-gray-700">
                                            {regel.aantal}
                                        </td>
                                        <td className="py-2">
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 print:hidden">
                                                <CheckBox
                                                    checked={regel.geleverd}
                                                    label="Geleverd"
                                                />
                                                <CheckBox
                                                    checked={regel.klaargezet}
                                                    label="Klaargezet"
                                                />
                                                <CheckBox
                                                    checked={regel.opLocatie}
                                                    label="Op locatie"
                                                />
                                            </div>
                                            {!regel.inOrde ? (
                                                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 print:mt-0">
                                                    <PrintTick label="Geleverd" />
                                                    <PrintTick label="Klaargezet" />
                                                    <span className="text-[10px] text-gray-400 self-center">
                                                        of
                                                    </span>
                                                    <PrintTick label="Op locatie" />
                                                </div>
                                            ) : (
                                                <span className="hidden print:inline text-xs text-emerald-800">
                                                    Compleet
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {item.heeftNativeOs ? (
                            <SpecPanel
                                tone="amber"
                                title="Schermen (Tizen / webOS / Android)"
                                hint="Deze schermen moeten binnengekomen, geprepareerd en klaargezet zijn vóór de klus."
                                className="print:bg-white print:border-gray-400"
                            >
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    <PrintTick label="Binnengekomen" />
                                    <PrintTick label="Geprepareerd" />
                                    <PrintTick label="Klaargezet" />
                                </div>
                            </SpecPanel>
                        ) : null}
                    </article>
                ))}
            </div>
        </PageShell>
    );
}
