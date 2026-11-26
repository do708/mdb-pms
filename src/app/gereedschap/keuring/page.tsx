"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import GereedschapQrScanner from "@/components/gereedschap/GereedschapQrScanner";
import StatusBadge from "@/components/gereedschap/StatusBadge";
import {
    PageShell,
    SpecPanel,
    specInputClassName,
} from "@/components/ui/SpecLayout";
import {
    TOOL_CHECKLISTS,
    isToolCategory,
    type ToolCategory,
} from "@/constants/gereedschap";
import { parseToolQrPayload } from "@/lib/gereedschap/parseQr";

type Asset = {
    id: string;
    code: string;
    name: string;
    category: string;
    categoryLabel: string;
    status: string;
    nextInspectionAt: string | null;
    assignedUser: { name: string | null } | null;
    inspections?: {
        id: string;
        inspectedAt: string;
        result: string;
        validUntil: string | null;
        pdfUrl: string | null;
        notes: string | null;
        checklist: { id: string; label: string; ok: boolean }[];
        inspector: { name: string | null } | null;
    }[];
};

function KeuringInner() {
    const search = useSearchParams();
    const initialCode = (search.get("asset") || "").toUpperCase();
    const wantScan = search.get("scan") === "1";

    const [codeInput, setCodeInput] = useState(initialCode);
    const [asset, setAsset] = useState<Asset | null>(null);
    const [list, setList] = useState<Asset[]>([]);
    const [caps, setCaps] = useState({ canInspect: false, canViewAll: false });
    const [error, setError] = useState("");
    const [notes, setNotes] = useState("");
    const [checks, setChecks] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState<"zoek" | "gepland" | "eigen">("zoek");

    const checklistDefs = useMemo(() => {
        if (!asset || !isToolCategory(asset.category)) return [];
        return TOOL_CHECKLISTS[asset.category as ToolCategory];
    }, [asset]);

    const loadList = useCallback(async () => {
        const params = new URLSearchParams();
        if (tab === "eigen" || !caps.canViewAll) params.set("mine", "1");
        if (tab === "gepland") {
            // Binnenkort + verlopen + nog te keuren: haal breed op, filter client-side
        }
        const res = await fetch(`/api/gereedschap/assets?${params}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            setList(data.assets || []);
            if (data.caps) {
                setCaps({
                    canInspect: Boolean(data.caps.canInspect),
                    canViewAll: Boolean(data.caps.canViewAll),
                });
            }
        }
    }, [caps.canViewAll, tab]);

    useEffect(() => {
        fetch("/api/gereedschap/me")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (d) {
                    setCaps({
                        canInspect: Boolean(d.canInspect),
                        canViewAll: Boolean(d.canViewAll),
                    });
                }
            })
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        loadList();
    }, [loadList]);

    useEffect(() => {
        if (initialCode) {
            void openCode(initialCode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCode]);

    async function openCode(code: string) {
        setError("");
        const cleaned =
            parseToolQrPayload(code) || code.trim().toUpperCase();
        if (!cleaned) return;
        setCodeInput(cleaned);
        const res = await fetch(
            `/api/gereedschap/assets/${encodeURIComponent(cleaned)}`
        );
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
            // Niet van jou / geen overzicht: publieke QR-statuspagina
            setAsset(null);
            window.location.href = `/asset/${encodeURIComponent(cleaned)}`;
            return;
        }
        if (!res.ok) {
            setAsset(null);
            setError(data.error || "Niet gevonden");
            return;
        }
        setAsset(data.asset);
        setNotes("");
        const defs = isToolCategory(data.asset.category)
            ? TOOL_CHECKLISTS[data.asset.category as ToolCategory]
            : [];
        const init: Record<string, boolean> = {};
        for (const d of defs) init[d.id] = false;
        setChecks(init);
        setTab("zoek");
    }

    async function submit(result: "goedgekeurd" | "afgekeurd") {
        if (!asset) return;
        setSaving(true);
        setError("");
        try {
            const checklist = checklistDefs.map((d) => ({
                id: d.id,
                ok: Boolean(checks[d.id]),
            }));
            const res = await fetch(
                `/api/gereedschap/assets/${asset.id}/inspect`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ result, checklist, notes }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Keuring mislukt");
                return;
            }
            setAsset(data.asset);
            await loadList();
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageShell>
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-sm text-[#0066FF] font-semibold">
                        Keuringsportaal
                    </p>
                    <h1 className="text-2xl font-bold">Keuring &amp; scan</h1>
                    <p className="text-sm text-slate-500">
                        Nieuwe keuring overschrijft historie niet. PDF-stub per
                        keuring.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                    <Link
                        href="/gereedschap/mijn"
                        className="text-[#0066FF] underline"
                    >
                        Mijn gereedschap
                    </Link>
                    <Link
                        href="/gereedschap"
                        className="text-[#0066FF] underline"
                    >
                        ← Hub
                    </Link>
                </div>
            </header>

            <div className="flex flex-wrap gap-2 items-center">
                {(
                    [
                        ["zoek", "Zoeken / scannen"],
                        ["gepland", "Gepland / binnenkort"],
                        ["eigen", "Mijn assets"],
                    ] as const
                ).map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={`
                            rounded-full border px-4 py-1.5 text-sm font-medium
                            ${
                                tab === id
                                    ? "bg-[#0066FF] text-white border-[#0066FF]"
                                    : "bg-white text-slate-700 border-slate-300"
                            }
                        `}
                    >
                        {label}
                    </button>
                ))}
                <Link
                    href="/gereedschap/mijn"
                    className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-[#0066FF]/40"
                >
                    Volledig overzicht
                </Link>
            </div>

            {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                    {error}
                </p>
            ) : null}

            {tab === "zoek" || wantScan ? (
                <SpecPanel title="Asset openen">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            className={specInputClassName}
                            value={codeInput}
                            onChange={(e) =>
                                setCodeInput(e.target.value.toUpperCase())
                            }
                            placeholder="MDB-G-00001 of plak QR-URL"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    void openCode(codeInput);
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="rounded-xl bg-[#0066FF] px-5 py-2.5 text-white font-semibold"
                            onClick={() => void openCode(codeInput)}
                        >
                            Openen
                        </button>
                        <GereedschapQrScanner
                            onScan={(code) => void openCode(code)}
                            autoOpen={wantScan && !initialCode}
                            className="
                                inline-flex items-center justify-center gap-2
                                rounded-xl border border-[#0066FF] bg-white
                                px-4 py-2.5 text-sm font-semibold text-[#0066FF]
                                hover:bg-sky-50 transition
                            "
                            label="Camera"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Gebruik de camera, of plak de code /{" "}
                        <code>/asset/…</code>-URL uit de QR. Tools die niet van
                        jou zijn openen de publieke statuspagina.
                    </p>
                </SpecPanel>
            ) : null}

            {(tab === "gepland" || tab === "eigen") && (
                <SpecPanel
                    title={
                        tab === "gepland"
                            ? "Binnenkort te keuren"
                            : "Mijn toegewezen assets"
                    }
                >
                    <ul className="divide-y divide-slate-100">
                        {(tab === "eigen"
                            ? list
                            : list.filter((a) => a.status === "binnenkort" || a.status === "verlopen" || a.status === "nog_te_keuren")
                        ).map((a) => (
                            <li
                                key={a.id}
                                className="py-3 flex flex-wrap items-center justify-between gap-2"
                            >
                                <div>
                                    <p className="font-mono text-sm text-[#0066FF]">
                                        {a.code}
                                    </p>
                                    <p className="font-medium">{a.name}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={a.status} />
                                    <button
                                        type="button"
                                        className="text-sm text-[#0066FF] underline"
                                        onClick={() => openCode(a.code)}
                                    >
                                        Open
                                    </button>
                                </div>
                            </li>
                        ))}
                        {list.length === 0 ? (
                            <li className="py-3 text-sm text-slate-500">
                                Geen items.
                            </li>
                        ) : null}
                    </ul>
                </SpecPanel>
            )}

            {asset ? (
                <SpecPanel title={`${asset.code} — ${asset.name}`}>
                    <div className="flex flex-wrap gap-3 items-center mb-4">
                        <StatusBadge status={asset.status} />
                        <span className="text-sm text-slate-500">
                            {asset.categoryLabel}
                        </span>
                        <Link
                            href={`/asset/${asset.code}`}
                            className="text-sm text-[#0066FF] underline"
                            target="_blank"
                        >
                            Publieke status
                        </Link>
                    </div>

                    {caps.canInspect ? (
                        <div className="space-y-4 border-t border-slate-100 pt-4">
                            <h3 className="font-semibold">Nieuwe keuring</h3>
                            <ul className="space-y-2">
                                {checklistDefs.map((d) => (
                                    <li key={d.id}>
                                        <label className="flex items-start gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                className="mt-1"
                                                checked={Boolean(checks[d.id])}
                                                onChange={(e) =>
                                                    setChecks((prev) => ({
                                                        ...prev,
                                                        [d.id]: e.target.checked,
                                                    }))
                                                }
                                            />
                                            <span>{d.label}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                            <label className="block text-sm">
                                <span className="text-gray-600">Opmerkingen</span>
                                <textarea
                                    className={specInputClassName}
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => submit("goedgekeurd")}
                                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-white font-semibold disabled:opacity-50"
                                >
                                    Goedkeuren
                                </button>
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => submit("afgekeurd")}
                                    className="rounded-xl bg-red-600 px-4 py-2.5 text-white font-semibold disabled:opacity-50"
                                >
                                    Afkeuren / reject
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 border-t border-slate-100 pt-4">
                            Je hebt geen keurmeester-rechten. Je kunt wel de
                            status en historie van eigen assets bekijken.
                        </p>
                    )}

                    <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
                        <h3 className="font-semibold">Historie</h3>
                        {(asset.inspections || []).length === 0 ? (
                            <p className="text-sm text-slate-500">
                                Nog geen keuringen.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {(asset.inspections || []).map((ins) => (
                                    <li
                                        key={ins.id}
                                        className="rounded-xl border border-slate-200 p-3 text-sm"
                                    >
                                        <div className="flex flex-wrap justify-between gap-2">
                                            <span className="font-medium">
                                                {ins.result} —{" "}
                                                {new Date(
                                                    ins.inspectedAt
                                                ).toLocaleString("nl-NL")}
                                            </span>
                                            <span className="text-slate-500">
                                                {ins.inspector?.name || "—"}
                                            </span>
                                        </div>
                                        {ins.pdfUrl ? (
                                            <a
                                                href={ins.pdfUrl}
                                                download={`${asset.code}-keuring.pdf`}
                                                className="text-[#0066FF] underline text-xs"
                                            >
                                                PDF-rapport downloaden
                                            </a>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </SpecPanel>
            ) : null}
        </PageShell>
    );
}

export default function KeuringPage() {
    return (
        <Suspense
            fallback={
                <PageShell>
                    <p>Keuringsportaal laden…</p>
                </PageShell>
            }
        >
            <KeuringInner />
        </Suspense>
    );
}
