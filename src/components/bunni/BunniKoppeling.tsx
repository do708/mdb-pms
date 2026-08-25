"use client";

import { useEffect, useRef, useState } from "react";
import {
    bunniPageUrl,
    isBunniUrlIdAsNumber,
    offertenummerUitTekst,
    parseBunniOfferteUrl,
} from "@/lib/bunni/urls";

export type BunniHit = {
    id: string;
    number: string;
    date: string | null;
    isFinalized: boolean;
    contactName: string | null;
    pdfUrl: string | null;
    snippet: string | null;
};

export type Linked = {
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

export function BunniDocumentPicker({
    label,
    kind,
    value,
    onSelect,
    onClear,
    disabled,
    compact,
}: {
    label?: string;
    kind: "offerte" | "factuur";
    value: Linked;
    onSelect: (hit: BunniHit) => void;
    onClear: () => void;
    disabled?: boolean;
    compact?: boolean;
}) {
    const [q, setQ] = useState("");
    const [formNumber, setFormNumber] = useState("");
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
                const params = new URLSearchParams({
                    kind,
                    q:
                        kind === "offerte"
                            ? [q, formNumber].filter(Boolean).join(" ")
                            : q,
                });
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
    }, [q, formNumber, kind, open]);

    const paginaUrl = bunniPageUrl(kind, value.id);
    const urlAlsNummer = isBunniUrlIdAsNumber(value.id, value.number);
    const urlHit = kind === "offerte" ? parseBunniOfferteUrl(q) : null;

    function koppelHit(hit: BunniHit) {
        const fromQuery = urlHit
            ? offertenummerUitTekst(q, urlHit.numeric)
            : null;
        const number = (
            formNumber.trim()
            || fromQuery
            || (isBunniUrlIdAsNumber(hit.id, hit.number) ? "" : hit.number)
        ).trim();

        if (kind === "offerte" && (!number || isBunniUrlIdAsNumber(hit.id, number))) {
            setError(
                "Vul het offertenummer uit het Bunni-formulier in. Dat is niet het nummer in de URL."
            );
            setOpen(true);
            return;
        }

        onSelect({ ...hit, number: number || hit.number });
        setQ("");
        setFormNumber("");
        setOpen(false);
        setError(null);
    }

    return (
        <div ref={boxRef} className="relative min-w-0">
            {label ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                </p>
            ) : null}
            {value.number ? (
                <div className="mt-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="font-semibold text-slate-800 truncate">
                        {value.number}
                    </span>
                    {paginaUrl ? (
                        <a
                            href={paginaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-[#0066FF] shrink-0"
                        >
                            pagina
                        </a>
                    ) : null}
                    {value.pdfUrl ? (
                        <a
                            href={value.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-slate-500 hover:text-slate-800 shrink-0"
                        >
                            pdf
                        </a>
                    ) : null}
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
                    {kind === "offerte" && urlAlsNummer ? (
                        <p className="mt-1 text-xs text-amber-800">
                            Dit is het nummer uit de URL, niet het
                            offertenummer uit het formulier. Ontkoppel en
                            koppel opnieuw met het formuliernummer.
                        </p>
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
                            setError(null);
                        }}
                        onFocus={() => setOpen(true)}
                        placeholder={
                            kind === "offerte"
                                ? "Plak de Bunni-paginalink van de offerte…"
                                : "Zoek factuurnummer in Bunni…"
                        }
                        className={
                            compact
                                ? "mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                : "mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        }
                    />
                    {kind === "offerte" ? (
                        <input
                            value={formNumber}
                            onChange={(e) => {
                                setFormNumber(e.target.value);
                                setError(null);
                            }}
                            placeholder="Offertenummer uit het formulier, bijv. 260470"
                            className={
                                compact
                                    ? "mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                    : "mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            }
                        />
                    ) : null}
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
                                    {kind === "offerte"
                                        ? q.trim()
                                            ? "Geen offerte gevonden. Plak de Bunni-link van de offertepagina en vul het offertenummer uit het formulier in."
                                            : "Plak de Bunni-paginalink en vul het offertenummer uit het formulier in."
                                        : "Geen facturen gevonden"}
                                </p>
                            ) : (
                                hits.map((hit) => (
                                    <button
                                        key={hit.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 hover:bg-[#e8f0ff] border-b border-slate-50 last:border-0"
                                        onClick={() => koppelHit(hit)}
                                    >
                                        <span className="font-semibold text-slate-800">
                                            {hit.number
                                            && !isBunniUrlIdAsNumber(
                                                hit.id,
                                                hit.number
                                            )
                                                ? hit.number
                                                : "Bunni-pagina"}
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
    showOfferte = true,
    showFactuur = true,
}: {
    offerte: Linked;
    factuur: Linked;
    saveUrl: string;
    disabled?: boolean;
    onUpdated?: (data: unknown) => void;
    showOfferte?: boolean;
    showFactuur?: boolean;
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
        offerteNumber?: string | null;
        offertePdfUrl?: string | null;
        factuurId?: string | null;
        factuurNumber?: string | null;
        factuurPdfUrl?: string | null;
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
        <div
            className={
                showOfferte && showFactuur
                    ? "grid sm:grid-cols-2 gap-4"
                    : "min-w-0"
            }
        >
            {showOfferte ? (
            <BunniDocumentPicker
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
                    void save({
                        offerteId: hit.id,
                        offerteNumber: hit.number,
                        offertePdfUrl: hit.pdfUrl,
                    });
                }}
                onClear={() => {
                    setLocalOfferte({ id: null, number: null, pdfUrl: null });
                    void save({ offerteId: null });
                }}
            />
            ) : null}
            {showFactuur ? (
            <BunniDocumentPicker
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
                    void save({
                        factuurId: hit.id,
                        factuurNumber: hit.number,
                        factuurPdfUrl: hit.pdfUrl,
                    });
                }}
                onClear={() => {
                    setLocalFactuur({ id: null, number: null, pdfUrl: null });
                    void save({ factuurId: null });
                }}
            />
            ) : null}
        </div>
    );
}
