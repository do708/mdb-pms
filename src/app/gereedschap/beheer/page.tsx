"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import AssetFilters, {
    EMPTY_FILTERS,
    type AssetFilterState,
} from "@/components/gereedschap/AssetFilters";
import StatusBadge from "@/components/gereedschap/StatusBadge";
import {
    PageShell,
    SpecPanel,
    specInputClassName,
    specSelectClassName,
} from "@/components/ui/SpecLayout";
import {
    TOOL_CATEGORIES,
    TOOL_CATEGORY_LABELS,
    type ToolCategory,
} from "@/constants/gereedschap";

type Asset = {
    id: string;
    code: string;
    name: string;
    category: string;
    categoryLabel: string;
    status: string;
    busKenteken: string | null;
    kantoor: boolean;
    photoUrl: string | null;
    serialNumber: string | null;
    assignedUser: { id: string; name: string | null; email: string } | null;
    qrPath: string;
};

type UserOpt = { id: string; name: string | null; email: string };

export default function BeheerPortaalPage() {
    const [filters, setFilters] = useState<AssetFilterState>(EMPTY_FILTERS);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [users, setUsers] = useState<UserOpt[]>([]);
    const [error, setError] = useState("");
    const [forbidden, setForbidden] = useState(false);
    const [canManage, setCanManage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState("");
    const [category, setCategory] = useState<ToolCategory>("G");
    const [serialNumber, setSerialNumber] = useState("");
    const [busKenteken, setBusKenteken] = useState("");
    const [kantoor, setKantoor] = useState(false);
    const [assignedUserId, setAssignedUserId] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (filters.q) params.set("q", filters.q);
            if (filters.bus) params.set("bus", filters.bus);
            if (filters.kantoor) params.set("kantoor", filters.kantoor);
            if (filters.status) params.set("status", filters.status);
            if (filters.category) params.set("category", filters.category);

            const res = await fetch(`/api/gereedschap/assets?${params}`);
            if (res.status === 403) {
                setForbidden(true);
                setAssets([]);
                return;
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Laden mislukt");
                return;
            }
            if (!data.caps?.canManage && !data.caps?.canViewAll) {
                setForbidden(true);
            }
            setCanManage(Boolean(data.caps?.canManage));
            setAssets(data.assets || []);
        } catch {
            setError("Laden mislukt");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        fetch("/api/users")
            .then((r) => (r.ok ? r.json() : []))
            .then((list) => {
                if (Array.isArray(list)) {
                    setUsers(
                        list.map(
                            (u: {
                                id: string;
                                name: string | null;
                                email: string;
                            }) => ({
                                id: u.id,
                                name: u.name,
                                email: u.email,
                            })
                        )
                    );
                }
            })
            .catch(() => undefined);
    }, []);

    async function createAsset() {
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/gereedschap/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    category,
                    serialNumber: serialNumber || null,
                    busKenteken: busKenteken || null,
                    kantoor,
                    assignedUserId: assignedUserId || null,
                    photoUrl: photoUrl || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Aanmaken mislukt");
                return;
            }
            setName("");
            setSerialNumber("");
            setBusKenteken("");
            setKantoor(false);
            setAssignedUserId("");
            setPhotoUrl("");
            setSelectedId(data.asset?.id ?? null);
            await load();
        } finally {
            setSaving(false);
        }
    }

    async function archiveAsset(id: string) {
        if (!confirm("Asset archiveren?")) return;
        const res = await fetch(`/api/gereedschap/assets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ archive: true }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error || "Archiveren mislukt");
            return;
        }
        await load();
    }

    if (forbidden) {
        return (
            <PageShell>
                <h1 className="text-2xl font-bold">Beheerportaal</h1>
                <p className="text-slate-600">
                    Geen overzichts- of beheerrechten. Vraag Dominic of Linda om
                    de capability{" "}
                    <code className="text-sm">overzichtAlleAssets</code> of{" "}
                    <code className="text-sm">gereedschapBeheer</code>.
                </p>
                <Link href="/gereedschap" className="text-[#0066FF] underline">
                    Terug naar hub
                </Link>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-sm text-[#0066FF] font-semibold">
                        Beheerportaal
                    </p>
                    <h1 className="text-2xl font-bold">Gereedschapsregister</h1>
                    <p className="text-sm text-slate-500">
                        Filters: naam, bus-kenteken, kantoor. QR:{" "}
                        <code className="text-xs">/asset/MDB-G-00001</code>
                    </p>
                </div>
                <Link
                    href="/gereedschap"
                    className="text-sm text-[#0066FF] underline"
                >
                    ← Hub
                </Link>
            </header>

            {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                    {error}
                </p>
            ) : null}

            {canManage ? (
            <SpecPanel title="Nieuw asset registreren">
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm block sm:col-span-2">
                        <span className="text-gray-600">Naam *</span>
                        <input
                            className={specInputClassName}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>
                    <label className="text-sm block">
                        <span className="text-gray-600">Categorie</span>
                        <select
                            className={specSelectClassName}
                            value={category}
                            onChange={(e) =>
                                setCategory(e.target.value as ToolCategory)
                            }
                        >
                            {TOOL_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    MDB-{c} — {TOOL_CATEGORY_LABELS[c]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm block">
                        <span className="text-gray-600">Serienummer</span>
                        <input
                            className={specInputClassName}
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                        />
                    </label>
                    <label className="text-sm block">
                        <span className="text-gray-600">Bus-kenteken</span>
                        <input
                            className={specInputClassName}
                            value={busKenteken}
                            onChange={(e) => setBusKenteken(e.target.value)}
                        />
                    </label>
                    <label className="text-sm block">
                        <span className="text-gray-600">Toegewezen aan</span>
                        <select
                            className={specSelectClassName}
                            value={assignedUserId}
                            onChange={(e) => setAssignedUserId(e.target.value)}
                        >
                            <option value="">— niemand —</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name || u.email}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm block sm:col-span-2">
                        <span className="text-gray-600">Foto-URL (optioneel)</span>
                        <input
                            className={specInputClassName}
                            value={photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                            placeholder="https://… of /uploads/…"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={kantoor}
                            onChange={(e) => setKantoor(e.target.checked)}
                        />
                        Staat op kantoor
                    </label>
                </div>
                <button
                    type="button"
                    disabled={saving || !name.trim()}
                    onClick={createAsset}
                    className="mt-4 rounded-xl bg-[#0066FF] px-5 py-3 text-white font-semibold disabled:opacity-50"
                >
                    {saving ? "Opslaan…" : "Registreren + QR-code"}
                </button>
            </SpecPanel>
            ) : (
                <p className="text-sm text-slate-500 rounded-xl border border-slate-200 bg-white p-4">
                    Alleen-lezen overzicht (geen beheer-capability). Filters
                    en QR blijven beschikbaar.
                </p>
            )}

            <SpecPanel title="Register">
                <AssetFilters value={filters} onChange={setFilters} />
                <div className="mt-4 overflow-x-auto">
                    {loading ? (
                        <p className="text-sm text-slate-500">Laden…</p>
                    ) : assets.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            Geen assets gevonden.
                        </p>
                    ) : (
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b">
                                    <th className="py-2 pr-3">Code</th>
                                    <th className="py-2 pr-3">Naam</th>
                                    <th className="py-2 pr-3">Status</th>
                                    <th className="py-2 pr-3">Bus</th>
                                    <th className="py-2 pr-3">Locatie</th>
                                    <th className="py-2 pr-3">Acties</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((a) => (
                                    <tr
                                        key={a.id}
                                        className={`border-b border-slate-100 ${
                                            selectedId === a.id
                                                ? "bg-sky-50/60"
                                                : ""
                                        }`}
                                    >
                                        <td className="py-2 pr-3 font-mono text-[#0066FF]">
                                            <Link href={a.qrPath}>{a.code}</Link>
                                        </td>
                                        <td className="py-2 pr-3">{a.name}</td>
                                        <td className="py-2 pr-3">
                                            <StatusBadge status={a.status} />
                                        </td>
                                        <td className="py-2 pr-3">
                                            {a.busKenteken || "—"}
                                        </td>
                                        <td className="py-2 pr-3">
                                            {a.kantoor
                                                ? "Kantoor"
                                                : a.assignedUser?.name || "—"}
                                        </td>
                                        <td className="py-2 pr-3 space-x-2 whitespace-nowrap">
                                            <a
                                                className="text-[#0066FF] underline"
                                                href={`/api/gereedschap/assets/${a.id}/qr`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                QR
                                            </a>
                                            <Link
                                                className="text-[#0066FF] underline"
                                                href={`/gereedschap/keuring?asset=${a.code}`}
                                            >
                                                Keur
                                            </Link>
                                            {canManage ? (
                                            <button
                                                type="button"
                                                className="text-red-600 underline"
                                                onClick={() =>
                                                    archiveAsset(a.id)
                                                }
                                            >
                                                Archiveer
                                            </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </SpecPanel>
        </PageShell>
    );
}
