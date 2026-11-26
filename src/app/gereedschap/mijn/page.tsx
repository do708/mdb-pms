"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, QrCode } from "lucide-react";

import GereedschapQrScanner from "@/components/gereedschap/GereedschapQrScanner";
import StatusBadge from "@/components/gereedschap/StatusBadge";
import {
    PageShell,
    SpecPanel,
} from "@/components/ui/SpecLayout";
import { TOOL_STATUS_LABELS, type ToolStatus } from "@/constants/gereedschap";

type Asset = {
    id: string;
    code: string;
    name: string;
    category: string;
    categoryLabel: string;
    status: string;
    statusLabel?: string;
    serialNumber: string | null;
    busKenteken: string | null;
    kantoor: boolean;
    photoUrl: string | null;
    nextInspectionAt: string | null;
    lastInspectionAt: string | null;
};

function formatNl(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("nl-NL");
}

export default function MijnGereedschapPage() {
    const router = useRouter();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userName, setUserName] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/gereedschap/assets?mine=1");
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Laden mislukt");
                setAssets([]);
                return;
            }
            setAssets(data.assets || []);
        } catch {
            setError("Laden mislukt");
            setAssets([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
        fetch("/api/auth/session")
            .then((r) => (r.ok ? r.json() : null))
            .then((s) => {
                const name = s?.user?.name;
                if (typeof name === "string" && name.trim()) {
                    setUserName(name.trim());
                }
            })
            .catch(() => undefined);
    }, [load]);

    const counts = useMemo(() => {
        const map: Record<string, number> = {};
        for (const a of assets) {
            map[a.status] = (map[a.status] || 0) + 1;
        }
        return map;
    }, [assets]);

    function onScanned(code: string) {
        router.push(`/gereedschap/keuring?asset=${encodeURIComponent(code)}`);
    }

    return (
        <PageShell>
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#0066FF]">
                        Digitaal gereedschap
                    </p>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Package className="h-7 w-7 text-[#0066FF]" />
                        Mijn gereedschap
                    </h1>
                    <p className="text-sm text-slate-500">
                        Overzicht van alles wat{" "}
                        {userName ? (
                            <>
                                op naam van{" "}
                                <span className="font-medium text-slate-700">
                                    {userName}
                                </span>{" "}
                                staat
                            </>
                        ) : (
                            "op jouw naam staat"
                        )}
                        .
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <GereedschapQrScanner onScan={onScanned} />
                    <Link
                        href="/gereedschap"
                        className="text-sm text-[#0066FF] underline px-2"
                    >
                        ← Hub
                    </Link>
                </div>
            </header>

            {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                    {error}
                </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                        Totaal op jouw naam
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                        {loading ? "…" : assets.length}
                    </p>
                </div>
                {(["goedgekeurd", "binnenkort", "verlopen", "afgekeurd"] as ToolStatus[])
                    .filter((s) => counts[s])
                    .map((s) => (
                        <div
                            key={s}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                {TOOL_STATUS_LABELS[s]}
                            </p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {counts[s]}
                            </p>
                        </div>
                    ))}
            </div>

            <SpecPanel title="Toegewezen assets">
                {loading ? (
                    <p className="text-sm text-slate-500">Laden…</p>
                ) : assets.length === 0 ? (
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-slate-500">
                            Er staat nog geen gereedschap op jouw naam. Scan een
                            QR om status te bekijken, of vraag kantoor om
                            toewijzing.
                        </p>
                        <Link
                            href="/gereedschap/keuring?scan=1"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066FF]"
                        >
                            <QrCode className="h-4 w-4" />
                            QR scannen
                        </Link>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {assets.map((a) => (
                            <li
                                key={a.id}
                                className="py-3 flex flex-wrap items-center gap-3 justify-between"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    {a.photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={a.photoUrl}
                                            alt=""
                                            className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                            <Package className="h-5 w-5 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-mono text-sm text-[#0066FF]">
                                            {a.code}
                                        </p>
                                        <p className="font-medium text-slate-900 truncate">
                                            {a.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {a.categoryLabel}
                                            {a.busKenteken
                                                ? ` · bus ${a.busKenteken}`
                                                : ""}
                                            {a.kantoor ? " · kantoor" : ""}
                                            {" · volgende keuring "}
                                            {formatNl(a.nextInspectionAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <StatusBadge status={a.status} />
                                    <Link
                                        href={`/gereedschap/keuring?asset=${encodeURIComponent(a.code)}`}
                                        className="text-sm text-[#0066FF] underline"
                                    >
                                        Open
                                    </Link>
                                    <Link
                                        href={`/asset/${a.code}`}
                                        className="text-sm text-slate-500 underline"
                                        target="_blank"
                                    >
                                        Status
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </SpecPanel>

            <p className="text-xs text-slate-400">
                Tip: met <strong>QR scannen</strong> open je meteen de status.
                Tools die niet van jou zijn openen de publieke statuspagina.
            </p>
        </PageShell>
    );
}
