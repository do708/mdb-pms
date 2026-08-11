"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { canAccessOffice } from "@/lib/auth/checkRole";
import {
    PageHeader,
    PageShell,
    SpecPageCard,
} from "@/components/ui/SpecLayout";
import type { KlaarzetStatusField } from "@/lib/klaarzetMateriaal";

interface MateriaalRegel {
    key: string;
    label: string;
    aantal: string;
    geleverd: boolean;
    geprepareerd: boolean | null;
    klaargezet: boolean;
    opLocatie: boolean;
    inOrde: boolean;
    nativeOsFlow: boolean;
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

function regelInOrde(regel: MateriaalRegel): boolean {
    if (regel.opLocatie) return true;
    if (regel.nativeOsFlow && !Boolean(regel.geprepareerd)) {
        return false;
    }
    return Boolean(regel.geleverd) && Boolean(regel.klaargezet);
}

function applyStatus(
    regel: MateriaalRegel,
    field: KlaarzetStatusField,
    value: boolean
): MateriaalRegel {
    const next: MateriaalRegel = { ...regel };
    if (field === "geleverd") next.geleverd = value;
    else if (field === "geprepareerd") next.geprepareerd = value;
    else if (field === "klaargezet") {
        next.klaargezet = value;
        if (value) next.geleverd = true;
    } else if (field === "opLocatie") next.opLocatie = value;
    next.inOrde = regelInOrde(next);
    return next;
}

/** Interactieve checkbox voor scherm; print gebruikt PrintTick. */
function StatusCheckBox({
    checked,
    label,
    disabled,
    onChange,
}: {
    checked: boolean;
    label: string;
    disabled?: boolean;
    onChange: (next: boolean) => void;
}) {
    return (
        <label
            className={`
                inline-flex items-center gap-1.5 text-xs select-none
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${checked ? "text-emerald-800" : "text-gray-700"}
            `}
        >
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
                className="
                    h-3.5 w-3.5 shrink-0 rounded-[2px]
                    border-gray-400 text-emerald-600
                    focus:ring-emerald-500 focus:ring-offset-0
                    accent-emerald-600
                    disabled:cursor-not-allowed
                "
            />
            {label}
        </label>
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
    const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

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

    const toggleStatus = useCallback(
        async (
            workorderId: string,
            regelKey: string,
            field: KlaarzetStatusField,
            value: boolean
        ) => {
            const saveKey = `${workorderId}:${regelKey}:${field}`;
            let snapshot: ControleItem[] | null = null;

            setSavingKeys((prev) => {
                const next = new Set(prev);
                next.add(saveKey);
                return next;
            });

            setItems((prev) => {
                snapshot = prev;
                return prev.map((item) => {
                    if (item.id !== workorderId) return item;
                    const alleRegels = item.alleRegels.map((r) =>
                        r.key === regelKey ? applyStatus(r, field, value) : r
                    );
                    return {
                        ...item,
                        alleRegels,
                        regels: alleRegels.filter((r) => !r.inOrde),
                    };
                });
            });

            setError("");

            try {
                const res = await fetch("/api/dashboard/materiaal-controle", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        workorderId,
                        regelKey,
                        field,
                        value,
                    }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data?.error) {
                    throw new Error(
                        typeof data?.error === "string"
                            ? data.error
                            : "Opslaan mislukt"
                    );
                }
            } catch (err) {
                if (snapshot) {
                    setItems(snapshot);
                }
                setError(
                    err instanceof Error ? err.message : "Opslaan mislukt"
                );
            } finally {
                setSavingKeys((prev) => {
                    const next = new Set(prev);
                    next.delete(saveKey);
                    return next;
                });
            }
        },
        []
    );

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
                            <div className="min-w-0 flex-1 space-y-0.5">
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
                                <p className="text-xs text-gray-500">
                                    {item.locatie || "—"}
                                </p>
                                <p className="text-xs text-gray-600">
                                    Aansturing:{" "}
                                    {item.aansturing.length > 0
                                        ? item.aansturing.join(", ")
                                        : "—"}
                                </p>
                            </div>
                            <Link
                                href={`/workorders/${item.id}/edit`}
                                className="
                                    print:hidden shrink-0 text-xs font-medium
                                    text-[#0066FF] hover:underline
                                    self-start
                                "
                            >
                                Werkbon openen →
                            </Link>
                        </div>

                        {item.heeftNativeOs ? (
                            <div
                                className="
                                    rounded-lg border border-amber-200
                                    bg-amber-50 px-3 py-2
                                    print:bg-white print:border-gray-400
                                "
                            >
                                <p className="font-semibold text-sm text-gray-800">
                                    Schermen (Tizen / webOS / Android)
                                </p>
                                <p className="text-xs text-gray-600 leading-snug mt-0.5">
                                    Deze schermen moeten binnengekomen,
                                    geprepareerd en klaargezet zijn vóór de
                                    klus.
                                </p>
                            </div>
                        ) : null}

                        <table className="w-full table-fixed text-left text-xs border-collapse">
                            <colgroup>
                                <col className="w-[22%]" />
                                <col className="w-[30%]" />
                                <col className="w-[48%]" />
                            </colgroup>
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
                                {item.alleRegels.length === 0 ? (
                                    <tr className="border-b border-gray-100">
                                        <td
                                            colSpan={3}
                                            className="py-2 text-gray-600"
                                        >
                                            Nog geen materiaal ingevuld — open
                                            de werkbon om materiaal te
                                            controleren of klaar te zetten.
                                        </td>
                                    </tr>
                                ) : (
                                    item.alleRegels.map((regel) => (
                                        <tr
                                            key={regel.key}
                                            className="border-b border-gray-100 last:border-0 align-top"
                                        >
                                            <td className="py-2 pr-2 font-semibold text-gray-800">
                                                {regel.label}
                                            </td>
                                            <td className="py-2 pr-2 text-gray-700 break-words">
                                                {regel.aantal}
                                            </td>
                                            <td className="py-2">
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 print:hidden">
                                                    <StatusCheckBox
                                                        checked={regel.geleverd}
                                                        disabled={
                                                            regel.opLocatie
                                                            || savingKeys.has(
                                                                `${item.id}:${regel.key}:geleverd`
                                                            )
                                                        }
                                                        label={
                                                            regel.nativeOsFlow
                                                                ? "Binnengekomen"
                                                                : "Geleverd"
                                                        }
                                                        onChange={(v) =>
                                                            toggleStatus(
                                                                item.id,
                                                                regel.key,
                                                                "geleverd",
                                                                v
                                                            )
                                                        }
                                                    />
                                                    {regel.nativeOsFlow ? (
                                                        <StatusCheckBox
                                                            checked={Boolean(
                                                                regel.geprepareerd
                                                            )}
                                                            disabled={
                                                                regel.opLocatie
                                                                || savingKeys.has(
                                                                    `${item.id}:${regel.key}:geprepareerd`
                                                                )
                                                            }
                                                            label="Geprepareerd"
                                                            onChange={(v) =>
                                                                toggleStatus(
                                                                    item.id,
                                                                    regel.key,
                                                                    "geprepareerd",
                                                                    v
                                                                )
                                                            }
                                                        />
                                                    ) : null}
                                                    <StatusCheckBox
                                                        checked={
                                                            regel.klaargezet
                                                        }
                                                        disabled={
                                                            regel.opLocatie
                                                            || savingKeys.has(
                                                                `${item.id}:${regel.key}:klaargezet`
                                                            )
                                                        }
                                                        label="Klaargezet"
                                                        onChange={(v) =>
                                                            toggleStatus(
                                                                item.id,
                                                                regel.key,
                                                                "klaargezet",
                                                                v
                                                            )
                                                        }
                                                    />
                                                    <span className="text-[10px] text-gray-400 self-center">
                                                        of
                                                    </span>
                                                    <StatusCheckBox
                                                        checked={
                                                            regel.opLocatie
                                                        }
                                                        disabled={savingKeys.has(
                                                            `${item.id}:${regel.key}:opLocatie`
                                                        )}
                                                        label="Op locatie"
                                                        onChange={(v) =>
                                                            toggleStatus(
                                                                item.id,
                                                                regel.key,
                                                                "opLocatie",
                                                                v
                                                            )
                                                        }
                                                    />
                                                </div>
                                                {!regel.inOrde ? (
                                                    <div className="mt-1.5 hidden print:flex flex-wrap gap-x-3 gap-y-1 print:mt-0">
                                                        {regel.nativeOsFlow ? (
                                                            <>
                                                                <PrintTick label="Binnengekomen" />
                                                                <PrintTick label="Geprepareerd" />
                                                                <PrintTick label="Klaargezet" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PrintTick label="Geleverd" />
                                                                <PrintTick label="Klaargezet" />
                                                            </>
                                                        )}
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </article>
                ))}
            </div>
        </PageShell>
    );
}
