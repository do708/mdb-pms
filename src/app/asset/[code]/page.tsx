"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import StatusBadge from "@/components/gereedschap/StatusBadge";

type PublicAsset = {
    code: string;
    name: string;
    categoryLabel: string;
    status: string;
    statusLabel: string;
    photoUrl: string | null;
    busKenteken: string | null;
    kantoor: boolean;
    nextInspectionAt: string | null;
    lastInspectionAt: string | null;
    assignedUser: { name: string | null } | null;
    latestInspection: {
        inspectedAt: string;
        result: string;
        validUntil: string | null;
    } | null;
};

function formatNl(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("nl-NL");
}

export default function PublicAssetPage() {
    const params = useParams();
    const code = String(params.code ?? "").toUpperCase();

    const [asset, setAsset] = useState<PublicAsset | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/asset/${encodeURIComponent(code)}`);
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    if (!cancelled) {
                        setError(data.error || "Asset niet gevonden");
                        setAsset(null);
                    }
                    return;
                }
                if (!cancelled) setAsset(data.asset);
            } catch {
                if (!cancelled) setError("Laden mislukt");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        if (code) load();
        return () => {
            cancelled = true;
        };
    }, [code]);

    return (
        <div className="min-h-dvh bg-gradient-to-b from-sky-50 to-slate-100 px-4 py-10">
            <div className="mx-auto max-w-lg space-y-6">
                <header className="text-center space-y-1">
                    <p className="text-sm font-semibold tracking-wide text-[#0066FF]">
                        MDB Networks
                    </p>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Gereedschapstatus
                    </h1>
                    <p className="text-sm text-slate-500">
                        Alleen-lezen keuringsportaal via QR
                    </p>
                </header>

                {loading ? (
                    <p className="text-center text-slate-500">Laden…</p>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-white p-6 text-center text-red-700">
                        {error}
                    </div>
                ) : asset ? (
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        {asset.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={asset.photoUrl}
                                alt={asset.name}
                                className="mx-auto h-40 w-auto rounded-xl object-contain"
                            />
                        ) : null}

                        <div className="space-y-1 text-center">
                            <p className="font-mono text-lg font-bold text-[#0066FF]">
                                {asset.code}
                            </p>
                            <h2 className="text-xl font-semibold text-slate-900">
                                {asset.name}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {asset.categoryLabel}
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <StatusBadge status={asset.status} />
                        </div>

                        <dl className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <dt className="text-slate-500">Toegewezen</dt>
                                <dd className="font-medium">
                                    {asset.assignedUser?.name ||
                                        (asset.kantoor
                                            ? "Kantoor"
                                            : asset.busKenteken
                                              ? `Bus ${asset.busKenteken}`
                                              : "—")}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Bus</dt>
                                <dd className="font-medium">
                                    {asset.busKenteken || "—"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Laatste keuring</dt>
                                <dd className="font-medium">
                                    {formatNl(asset.lastInspectionAt)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Geldig tot</dt>
                                <dd className="font-medium">
                                    {formatNl(
                                        asset.latestInspection?.validUntil ??
                                            asset.nextInspectionAt
                                    )}
                                </dd>
                            </div>
                        </dl>

                        {asset.latestInspection ? (
                            <p className="text-center text-xs text-slate-400">
                                Laatste uitslag:{" "}
                                {asset.latestInspection.result} (
                                {formatNl(asset.latestInspection.inspectedAt)})
                            </p>
                        ) : (
                            <p className="text-center text-xs text-slate-400">
                                Nog geen keuring geregistreerd
                            </p>
                        )}
                    </section>
                ) : null}
            </div>
        </div>
    );
}
