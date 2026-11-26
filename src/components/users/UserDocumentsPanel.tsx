"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Trash2, ExternalLink, X } from "lucide-react";

import {
    USER_DOCUMENT_TYPES,
    USER_DOCUMENT_TYPE_LABELS,
    type UserDocumentType,
} from "@/constants/userDocumentTypes";

export type UserDocumentDto = {
    id: string;
    type: string;
    number: string;
    expiresAt: string | null;
    neverExpires: boolean;
    fileUrl: string;
    originalName: string | null;
    contentType: string | null;
};

type Props = {
    userId: string;
    /** Alleen admin mag uploaden/bewerken; office mag lezen. */
    canEdit: boolean;
};

const ACCEPT =
    ".pdf,.png,.jpg,.jpeg,.webp,.heic,application/pdf,image/*";

function isAllowedFile(file: File): boolean {
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
        return true;
    }
    return /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

export default function UserDocumentsPanel({ userId, canEdit }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [docs, setDocs] = useState<UserDocumentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);
    const [defaultType, setDefaultType] =
        useState<UserDocumentType>("id_kaart");

    const load = useCallback(async () => {
        setError("");
        try {
            const response = await fetch(`/api/users/${userId}/documents`);
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                setError(
                    typeof data?.error === "string"
                        ? data.error
                        : "Documenten laden mislukt"
                );
                setDocs([]);
                return;
            }
            setDocs(Array.isArray(data) ? data : []);
        } catch {
            setError("Documenten laden mislukt");
            setDocs([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        void load();
    }, [load]);

    async function uploadFiles(fileList: FileList | File[]) {
        if (!canEdit || uploading) return;
        const files = Array.from(fileList).filter(isAllowedFile);
        if (files.length === 0) {
            setError("Kies een PDF of afbeelding");
            return;
        }

        setError("");
        setUploading(true);
        try {
            for (const file of files) {
                const body = new FormData();
                body.append("file", file);
                body.append("type", defaultType);
                body.append("neverExpires", "false");

                const response = await fetch(
                    `/api/users/${userId}/documents`,
                    { method: "POST", body }
                );
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    setError(
                        typeof data.error === "string" && data.error.trim()
                            ? data.error
                            : `Upload mislukt: ${file.name}`
                    );
                    break;
                }
            }
            await load();
        } catch {
            setError("Upload mislukt (netwerk of server)");
        } finally {
            setUploading(false);
        }
    }

    async function patchDoc(
        docId: string,
        patch: Partial<{
            type: string;
            number: string;
            expiresAt: string | null;
            neverExpires: boolean;
        }>
    ) {
        if (!canEdit) return;
        setSavingId(docId);
        setError("");
        try {
            const response = await fetch(
                `/api/users/${userId}/documents/${docId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(patch),
                }
            );
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(
                    typeof data.error === "string"
                        ? data.error
                        : "Opslaan mislukt"
                );
                return;
            }
            setDocs((prev) =>
                prev.map((d) => (d.id === docId ? { ...d, ...data } : d))
            );
        } catch {
            setError("Opslaan mislukt");
        } finally {
            setSavingId(null);
        }
    }

    async function removeDoc(docId: string) {
        if (!canEdit) return;
        if (!window.confirm("Document verwijderen?")) return;
        setSavingId(docId);
        setError("");
        try {
            const response = await fetch(
                `/api/users/${userId}/documents/${docId}`,
                { method: "DELETE" }
            );
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setError(
                    typeof data.error === "string"
                        ? data.error
                        : "Verwijderen mislukt"
                );
                return;
            }
            setDocs((prev) => prev.filter((d) => d.id !== docId));
        } catch {
            setError("Verwijderen mislukt");
        } finally {
            setSavingId(null);
        }
    }

    return (
        <section className="space-y-4 rounded-2xl border bg-white p-4 sm:p-5">
            <header className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                    Documenten
                </h2>
                <p className="text-xs text-slate-500 sm:text-sm">
                    ID, rijbewijs, certificaten, VOG e.d. Circa één maand voor
                    de verloopdatum krijgt projects@mdb-networks.nl een
                    e-mail.
                </p>
            </header>

            {canEdit ? (
                <div className="space-y-3">
                    <label className="block max-w-xs">
                        <span className="text-sm text-gray-600">
                            Type voor nieuwe upload
                        </span>
                        <select
                            value={defaultType}
                            onChange={(e) =>
                                setDefaultType(
                                    e.target.value as UserDocumentType
                                )
                            }
                            className="mt-1 w-full rounded-xl border bg-white p-3 text-sm"
                        >
                            {USER_DOCUMENT_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {USER_DOCUMENT_TYPE_LABELS[t]}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragging(false);
                            if (e.dataTransfer.files?.length) {
                                void uploadFiles(e.dataTransfer.files);
                            }
                        }}
                        className={`rounded-2xl border-2 border-dashed p-4 text-center transition sm:p-6 ${
                            dragging
                                ? "border-[#0066FF] bg-sky-50"
                                : "border-slate-300 bg-slate-50/50"
                        } ${uploading ? "opacity-70" : ""}`}
                    >
                        <FileUp
                            className="mx-auto mb-2 h-8 w-8 text-[#0066FF]"
                            aria-hidden
                        />
                        <p className="text-sm font-medium text-slate-800">
                            {uploading
                                ? "Bezig met uploaden…"
                                : "Sleep bestanden hierheen"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            PDF of foto. Op telefoon: kies uit bestanden.
                        </p>
                        <button
                            type="button"
                            disabled={uploading}
                            onClick={() => inputRef.current?.click()}
                            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                        >
                            Bestanden kiezen
                        </button>
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            accept={ACCEPT}
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => {
                                if (e.target.files?.length) {
                                    void uploadFiles(e.target.files);
                                }
                                e.target.value = "";
                            }}
                        />
                    </div>
                </div>
            ) : null}

            {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            ) : null}

            {loading ? (
                <p className="text-sm text-slate-500">Documenten laden…</p>
            ) : docs.length === 0 ? (
                <p className="text-sm text-slate-500">
                    Nog geen documenten toegevoegd.
                </p>
            ) : (
                <>
                    {/* Desktop / tablet table — volle breedte, één rij per document */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[56rem] table-fixed border-collapse text-left text-sm">
                            <colgroup>
                                <col className="w-[12rem]" />
                                <col className="w-[9rem]" />
                                <col />
                                <col className="w-[14rem]" />
                            </colgroup>
                            <thead>
                                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                                    <th className="py-2 pr-2 font-semibold">
                                        Type
                                    </th>
                                    <th className="py-2 pr-2 font-semibold">
                                        Nummer
                                    </th>
                                    <th className="py-2 pr-2 font-semibold">
                                        Verloop
                                    </th>
                                    <th className="py-2 font-semibold">
                                        Bestand
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.map((doc) => (
                                    <DocumentTableRow
                                        key={doc.id}
                                        doc={doc}
                                        canEdit={canEdit}
                                        busy={savingId === doc.id}
                                        onPatch={patchDoc}
                                        onRemove={removeDoc}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <ul className="space-y-3 md:hidden">
                        {docs.map((doc) => (
                            <li
                                key={doc.id}
                                className="space-y-3 rounded-xl border border-slate-200 p-3"
                            >
                                <DocumentFields
                                    doc={doc}
                                    canEdit={canEdit}
                                    busy={savingId === doc.id}
                                    onPatch={patchDoc}
                                    onRemove={removeDoc}
                                />
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}

function DocumentTableRow(props: {
    doc: UserDocumentDto;
    canEdit: boolean;
    busy: boolean;
    onPatch: (
        id: string,
        patch: Partial<{
            type: string;
            number: string;
            expiresAt: string | null;
            neverExpires: boolean;
        }>
    ) => Promise<void>;
    onRemove: (id: string) => Promise<void>;
}) {
    const { doc, canEdit, busy, onPatch, onRemove } = props;

    return (
        <tr className="border-b border-slate-100 align-middle">
            <td className="py-3 pr-2 align-middle">
                <TypeSelect
                    value={doc.type}
                    disabled={!canEdit || busy}
                    onChange={(type) => void onPatch(doc.id, { type })}
                />
            </td>
            <td className="py-3 pr-2 align-middle">
                <NumberInput
                    value={doc.number}
                    disabled={!canEdit || busy}
                    onCommit={(number) => void onPatch(doc.id, { number })}
                />
            </td>
            <td className="py-3 pr-2 align-middle">
                <ExpiryFields
                    doc={doc}
                    disabled={!canEdit || busy}
                    onPatch={(patch) => void onPatch(doc.id, patch)}
                />
            </td>
            <td className="py-3 align-middle">
                <div className="flex items-center gap-2">
                    <FileLink doc={doc} />
                    {canEdit ? (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onRemove(doc.id)}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            aria-label="Document verwijderen"
                            title="Verwijderen"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            </td>
        </tr>
    );
}

function DocumentFields(props: {
    doc: UserDocumentDto;
    canEdit: boolean;
    busy: boolean;
    onPatch: (
        id: string,
        patch: Partial<{
            type: string;
            number: string;
            expiresAt: string | null;
            neverExpires: boolean;
        }>
    ) => Promise<void>;
    onRemove: (id: string) => Promise<void>;
}) {
    const { doc, canEdit, busy, onPatch, onRemove } = props;

    return (
        <>
            <div className="flex items-start justify-between gap-2">
                <FileLink doc={doc} />
                {canEdit ? (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onRemove(doc.id)}
                        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label="Verwijderen"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                ) : null}
            </div>
            <label className="block">
                <span className="text-xs text-slate-500">Type</span>
                <TypeSelect
                    value={doc.type}
                    disabled={!canEdit || busy}
                    onChange={(type) => void onPatch(doc.id, { type })}
                />
            </label>
            <label className="block">
                <span className="text-xs text-slate-500">Nummer</span>
                <NumberInput
                    value={doc.number}
                    disabled={!canEdit || busy}
                    onCommit={(number) => void onPatch(doc.id, { number })}
                />
            </label>
            <div>
                <span className="text-xs text-slate-500">Verloop</span>
                <ExpiryFields
                    doc={doc}
                    disabled={!canEdit || busy}
                    onPatch={(patch) => void onPatch(doc.id, patch)}
                />
            </div>
        </>
    );
}

function TypeSelect(props: {
    value: string;
    disabled: boolean;
    onChange: (type: string) => void;
}) {
    return (
        <select
            value={props.value}
            disabled={props.disabled}
            onChange={(e) => props.onChange(e.target.value)}
            className="mt-0.5 w-full min-h-11 rounded-xl border bg-white px-3 py-2 text-sm disabled:bg-slate-50"
        >
            {USER_DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                    {USER_DOCUMENT_TYPE_LABELS[t]}
                </option>
            ))}
        </select>
    );
}

function NumberInput(props: {
    value: string;
    disabled: boolean;
    onCommit: (value: string) => void;
}) {
    const [local, setLocal] = useState(props.value);
    useEffect(() => {
        setLocal(props.value);
    }, [props.value]);

    return (
        <input
            value={local}
            disabled={props.disabled}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={() => {
                if (local !== props.value) props.onCommit(local);
            }}
            placeholder="Optioneel"
            className="mt-0.5 w-full min-h-11 rounded-xl border px-3 py-2 text-sm disabled:bg-slate-50"
        />
    );
}

const MONTH_LABELS_NL = [
    "jan",
    "feb",
    "mrt",
    "apr",
    "mei",
    "jun",
    "jul",
    "aug",
    "sep",
    "okt",
    "nov",
    "dec",
] as const;

function daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

function parseYmd(value: string | null): {
    year: string;
    month: string;
    day: string;
} {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { year: "", month: "", day: "" };
    }
    const [year, month, day] = value.split("-");
    return { year, month, day };
}

function buildYearOptions(selectedYear: string): number[] {
    const now = new Date().getFullYear();
    const start = now - 2;
    const end = now + 15;
    const years: number[] = [];
    for (let y = start; y <= end; y += 1) years.push(y);
    const selected = Number(selectedYear);
    if (selectedYear && Number.isFinite(selected) && !years.includes(selected)) {
        years.push(selected);
        years.sort((a, b) => a - b);
    }
    return years;
}

function ExpiryFields(props: {
    doc: UserDocumentDto;
    disabled: boolean;
    onPatch: (patch: {
        expiresAt?: string | null;
        neverExpires?: boolean;
    }) => void;
}) {
    const { doc, disabled, onPatch } = props;
    const parsed = parseYmd(doc.expiresAt);
    const [year, setYear] = useState(parsed.year);
    const [month, setMonth] = useState(parsed.month);
    const [day, setDay] = useState(parsed.day);

    useEffect(() => {
        const next = parseYmd(doc.expiresAt);
        setYear(next.year);
        setMonth(next.month);
        setDay(next.day);
    }, [doc.expiresAt, doc.id]);

    const yearNum = Number(year) || new Date().getFullYear();
    const monthNum = Number(month) || 1;
    const maxDay = daysInMonth(yearNum, monthNum);
    const selectClass =
        "min-h-11 rounded-xl border bg-white px-2 py-2 text-sm disabled:bg-slate-50";

    function commitParts(nextYear: string, nextMonth: string, nextDay: string) {
        // Pas opslaan als dag/maand/jaar compleet zijn; tussentijds wissen
        // alleen via de X-knop (voorkomt API-calls tijdens invullen).
        if (!nextYear || !nextMonth || !nextDay) return;
        const y = Number(nextYear);
        const m = Number(nextMonth);
        const d = Number(nextDay);
        const cappedDay = Math.min(d, daysInMonth(y, m));
        const ymd = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(cappedDay).padStart(2, "0")}`;
        if (ymd !== doc.expiresAt) {
            onPatch({ neverExpires: false, expiresAt: ymd });
        }
    }

    return (
        <div className="mt-0.5 flex flex-nowrap items-center gap-2 overflow-x-auto">
            <label className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm whitespace-nowrap">
                <input
                    type="checkbox"
                    checked={doc.neverExpires}
                    disabled={disabled}
                    onChange={(e) => {
                        const neverExpires = e.target.checked;
                        onPatch(
                            neverExpires
                                ? { neverExpires: true, expiresAt: null }
                                : { neverExpires: false }
                        );
                    }}
                />
                Verloopt niet
            </label>
            {!doc.neverExpires ? (
                <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
                    <select
                        aria-label="Dag"
                        value={day}
                        disabled={disabled}
                        onChange={(e) => {
                            const nextDay = e.target.value;
                            setDay(nextDay);
                            commitParts(year, month, nextDay);
                        }}
                        className={`${selectClass} w-[4.25rem]`}
                    >
                        <option value="">dag</option>
                        {Array.from({ length: maxDay }, (_, i) => {
                            const value = String(i + 1).padStart(2, "0");
                            return (
                                <option key={value} value={value}>
                                    {i + 1}
                                </option>
                            );
                        })}
                    </select>
                    <select
                        aria-label="Maand"
                        value={month}
                        disabled={disabled}
                        onChange={(e) => {
                            const nextMonth = e.target.value;
                            const nextMax = daysInMonth(
                                Number(year) || new Date().getFullYear(),
                                Number(nextMonth) || 1
                            );
                            const nextDay =
                                day && Number(day) > nextMax
                                    ? String(nextMax).padStart(2, "0")
                                    : day;
                            setMonth(nextMonth);
                            setDay(nextDay);
                            commitParts(year, nextMonth, nextDay);
                        }}
                        className={`${selectClass} w-[5.5rem]`}
                    >
                        <option value="">maand</option>
                        {MONTH_LABELS_NL.map((label, i) => {
                            const value = String(i + 1).padStart(2, "0");
                            return (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            );
                        })}
                    </select>
                    <select
                        aria-label="Jaar"
                        value={year}
                        disabled={disabled}
                        onChange={(e) => {
                            const nextYear = e.target.value;
                            const nextMax = daysInMonth(
                                Number(nextYear) || new Date().getFullYear(),
                                Number(month) || 1
                            );
                            const nextDay =
                                day && Number(day) > nextMax
                                    ? String(nextMax).padStart(2, "0")
                                    : day;
                            setYear(nextYear);
                            setDay(nextDay);
                            commitParts(nextYear, month, nextDay);
                        }}
                        className={`${selectClass} w-[5.25rem]`}
                    >
                        <option value="">jaar</option>
                        {buildYearOptions(year).map((y) => (
                            <option key={y} value={String(y)}>
                                {y}
                            </option>
                        ))}
                    </select>
                    {doc.expiresAt || year || month || day ? (
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                                setYear("");
                                setMonth("");
                                setDay("");
                                onPatch({
                                    neverExpires: false,
                                    expiresAt: null,
                                });
                            }}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                            aria-label="Datum wissen"
                            title="Datum wissen"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

function FileLink({ doc }: { doc: UserDocumentDto }) {
    const label = doc.originalName || "Bestand";
    return (
        <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 max-w-[9rem] items-center gap-1.5 text-sm font-medium text-[#0066FF] hover:underline"
            title={label}
        >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{label}</span>
        </a>
    );
}
