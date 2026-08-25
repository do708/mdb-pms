"use client";

import { useEffect, useRef, useState } from "react";

type BunniHit = {
    id: string;
    number: string;
    date: string | null;
    isFinalized: boolean;
    contactName: string | null;
    pdfUrl: string | null;
    snippet: string | null;
};

type Linked = {
    id: string | null;
    number: string | null;
    pdfUrl: string | null;
};

function formatDate(iso: string | null) {
    if (!iso) {
        return "";
    }
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) {
        return iso;
    }
    return d.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function Picker({
    label,
    kind,
    value,
    onSelect,
    onClear,
    disabled,
}: {
    label: string;
    kind: "offerte" | "factuur";
    value: Linked;
    onSelect: (hit: BunniHit) => void;
    onClear: () => void;
    disabled?: boolean;
}) {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [hits, setHits] = useState<BunniHit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!boxRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        const t = window.setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ kind, q });
                const res = await fetch(`/api/bunni/invoices?${params}`);
                const data = await res.json();
                if (!res.ok) {
                    setHits([]);
                    setError(data.error || "Zoeken mislukt");
                    return;
                }
                setHits(Array.isArray(data.items) ? data.items : []);
            } catch {
                setError("Zoeken mislukt");
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => window.clearTimeout(t);
    }, [q, kind, open]);

    return (
        <div ref={boxRef} className="relative min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            {value.number ? (
                <div className="mt-1 flex items-center gap-2 min-w-0">
                    {value.pdfUrl ? (
                        <a
                            href={value.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[#0066FF] truncate"
                        >
                            {value.number}
                        </a>
                    ) : (
                        <span className="font-semibold text-slate-800 truncate">
                            {value.number}
                        </span>
                    )}
                    {!disabled ? (
                        <button
                            type="button"
                            onClick={onClear}
                            className="text-xs text-slate-500 hover:text-slate-800 shrink-0"
                        >
                            Ontkoppel
                        </button>
                    ) : null}
                </div>
            ) : (
                <p className="mt-1 text-sm text-slate-400">Nog niet gekoppeld</p>
            )}
            {!disabled ? (
                <>
                    <input
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        placeholder={`Zoek ${label.toLowerCase()} in Bunni…`}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    {open ? (
                        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                            {loading ? (
                                <p className="px-3 py-2 text-sm text-slate-500">
                                    Zoeken…
                                </p>
                            ) : error ? (
                                <p className="px-3 py-2 text-sm text-red-600">
                                    {error}
                                </p>
                            ) : hits.length === 0 ? (
                                <p className="px-3 py-2 text-sm text-slate-500">
                                    Geen resultaten
                                </p>
                            ) : (
                                hits.map((hit) => (
                                    <button
                                        key={hit.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 hover:bg-[#e8f0ff] border-b border-slate-50 last:border-0"
                                        onClick={() => {
                                            onSelect(hit);
                                            setQ("");
                                            setOpen(false);
                                        }}
                                    >
                                        <span className="font-semibold text-slate-800">
                                            {hit.number}
                                        </span>
                                        <span className="ml-2 text-[10px] font-semibold uppercase text-slate-400">
                                            {hit.isFinalized
                                                ? "Factuur"
                                                : "Offerte"}
                                        </span>
                                        <span className="block text-xs text-slate-500 truncate">
                                            {[
                                                hit.contactName,
                                                formatDate(hit.date),
                                                hit.snippet,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}

export default function BunniKoppeling({
    offerte,
    factuur,
    saveUrl,
    disabled,
    onUpdated,
}: {
    offerte: Linked;
    factuur: Linked;
    saveUrl: string;
    disabled?: boolean;
    onUpdated?: (data: unknown) => void;
}) {
    const [saving, setSaving] = useState(false);
    const [localOfferte, setLocalOfferte] = useState(offerte);
    const [localFactuur, setLocalFactuur] = useState(factuur);

    useEffect(() => {
        setLocalOfferte(offerte);
        setLocalFactuur(factuur);
    }, [offerte.id, offerte.number, factuur.id, factuur.number]);

    async function save(body: {
        offerteId?: string | null;
        factuurId?: string | null;
    }) {
        setSaving(true);
        try {
            const res = await fetch(saveUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Koppelen mislukt");
                return;
            }
            onUpdated?.(data);
        } catch {
            alert("Koppelen mislukt");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="grid sm:grid-cols-2 gap-4">
            <Picker
                label="Offertenummer"
                kind="offerte"
                value={localOfferte}
                disabled={disabled || saving}
                onSelect={(hit) => {
                    setLocalOfferte({
                        id: hit.id,
                        number: hit.number,
                        pdfUrl: hit.pdfUrl,
                    });
                    void save({ offerteId: hit.id });
                }}
                onClear={() => {
                    setLocalOfferte({ id: null, number: null, pdfUrl: null });
                    void save({ offerteId: null });
                }}
            />
            <Picker
                label="Factuurnummer"
                kind="factuur"
                value={localFactuur}
                disabled={disabled || saving}
                onSelect={(hit) => {
                    setLocalFactuur({
                        id: hit.id,
                        number: hit.number,
                        pdfUrl: hit.pdfUrl,
                    });
                    void save({ factuurId: hit.id });
                }}
                onClear={() => {
                    setLocalFactuur({ id: null, number: null, pdfUrl: null });
                    void save({ factuurId: null });
                }}
            />
        </div>
    );
}
