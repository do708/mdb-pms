"use client";

import { useEffect, useRef, useState } from "react";

import {
    SpecFieldLabel,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
    specInputClassName,
} from "@/components/ui/SpecLayout";
import type { ProjectBijlage } from "@/components/projects/ProjectPlattegronden";

interface Props {
    projectId: string;
    tekst: string | null;
    items: ProjectBijlage[];
    canEdit?: boolean;
    onChanged?: () => void | Promise<void>;
}

function icoonVoor(naam: string): string {
    const n = naam.toLowerCase();

    if (n.endsWith(".pdf")) {
        return "📄";
    }

    if (n.match(/\.(png|jpe?g|gif|webp|heic)$/)) {
        return "🖼️";
    }

    if (n.match(/\.(docx?|xlsx?|pptx?)$/)) {
        return "📑";
    }

    return "📎";
}

function datumNL(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
}

export default function ProjectIntakeGegevens({
    projectId,
    tekst,
    items,
    canEdit = false,
    onChanged,
}: Props) {
    const [waarde, setWaarde] = useState(tekst ?? "");
    const [opslaanBezig, setOpslaanBezig] = useState(false);
    const [uploadBezig, setUploadBezig] = useState(false);
    const [sleepActief, setSleepActief] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setWaarde(tekst ?? "");
    }, [tekst]);

    const dirty = waarde !== (tekst ?? "");

    async function slaTekstOp() {
        if (!canEdit || !dirty) {
            return;
        }

        setOpslaanBezig(true);

        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ intakeTekst: waarde }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                alert(data?.error || "Intake opslaan mislukt");
                return;
            }

            await onChanged?.();
        } catch (error) {
            console.error(error);
            alert("Intake opslaan mislukt");
        } finally {
            setOpslaanBezig(false);
        }
    }

    async function uploadBestanden(bestanden: FileList | File[]) {
        const lijst = Array.from(bestanden);

        if (lijst.length === 0) {
            return;
        }

        setUploadBezig(true);

        try {
            for (const file of lijst) {
                const body = new FormData();
                body.append("file", file);
                body.append("kind", "intake");

                const res = await fetch(
                    `/api/projects/${projectId}/attachments`,
                    {
                        method: "POST",
                        body,
                    }
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    alert(
                        data?.error
                            ? `Uploaden mislukt: ${data.error}`
                            : `Uploaden mislukt (${res.status})`
                    );
                    continue;
                }
            }

            await onChanged?.();
        } finally {
            setUploadBezig(false);
        }
    }

    async function verwijder(id: string) {
        if (!confirm("Dit bestand verwijderen?")) {
            return;
        }

        const res = await fetch(
            `/api/projects/${projectId}/attachments/${id}`,
            { method: "DELETE" }
        );

        if (res.ok) {
            await onChanged?.();
        } else {
            alert("Verwijderen mislukt");
        }
    }

    return (
        <SpecPageCard>
            <SpecPanel
                title="Intake gegevens"
                hint="Wens van de klant, toelichting en bijlagen van de intake."
            >
                <div className="space-y-3">
                    {canEdit ? (
                        <label className="block">
                            <SpecFieldLabel>
                                Wens / toelichting
                            </SpecFieldLabel>
                            <textarea
                                rows={5}
                                value={waarde}
                                disabled={opslaanBezig}
                                onChange={(e) => setWaarde(e.target.value)}
                                onBlur={() => {
                                    void slaTekstOp();
                                }}
                                placeholder="Beschrijf wat de klant wil of wat er bij de intake is afgesproken"
                                className={`${specInputClassName} min-h-[7.5rem] resize-y`}
                            />
                            {dirty ? (
                                <button
                                    type="button"
                                    disabled={opslaanBezig}
                                    onClick={() => {
                                        void slaTekstOp();
                                    }}
                                    className="mt-2 rounded-xl px-3 py-2 text-sm font-bold bg-[#0066FF] text-white hover:bg-[#0052cc] disabled:opacity-60"
                                >
                                    {opslaanBezig
                                        ? "Opslaan..."
                                        : "Toelichting opslaan"}
                                </button>
                            ) : null}
                        </label>
                    ) : waarde.trim() ? (
                        <div>
                            <SpecFieldLabel>Wens / toelichting</SpecFieldLabel>
                            <p className="mt-0.5 text-sm text-gray-800 whitespace-pre-wrap">
                                {waarde}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">
                            Nog geen intake-toelichting.
                        </p>
                    )}

                    {canEdit ? (
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setSleepActief(true);
                            }}
                            onDragLeave={() => setSleepActief(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setSleepActief(false);
                                if (e.dataTransfer.files?.length) {
                                    void uploadBestanden(e.dataTransfer.files);
                                }
                            }}
                            onClick={() => inputRef.current?.click()}
                            className={`
                                rounded-lg border border-dashed px-3 py-4
                                text-center cursor-pointer transition bg-white
                                ${
                                    sleepActief
                                        ? "border-sky-400 bg-sky-50"
                                        : "border-gray-300 hover:border-sky-300 hover:bg-sky-50/40"
                                }
                            `}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                multiple
                                accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx,.xls,.xlsx,.txt,.zip,application/pdf,image/*"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.length) {
                                        void uploadBestanden(e.target.files);
                                    }
                                    e.target.value = "";
                                }}
                            />
                            <div className="text-2xl mb-1" aria-hidden>
                                📎
                            </div>
                            <p className="text-sm font-medium text-gray-700">
                                {uploadBezig
                                    ? "Bezig met opslaan..."
                                    : "Sleep bestanden hierheen of klik om te kiezen"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                PDF, foto of document
                            </p>
                        </div>
                    ) : null}

                    {items.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Nog geen bestanden bij de intake.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {items.map((item) => {
                                const naam =
                                    item.originalName
                                    ?? item.filename
                                    ?? "bestand";

                                return (
                                    <li key={item.id}>
                                        <SpecListRow className="flex items-center justify-between gap-2">
                                            <a
                                                href={`/api/projects/${projectId}/attachments/${item.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 min-w-0 hover:underline"
                                            >
                                                <span className="text-base shrink-0">
                                                    {icoonVoor(naam)}
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-medium text-gray-900 truncate">
                                                        {naam}
                                                    </span>
                                                    <span className="block text-xs text-gray-500">
                                                        {datumNL(item.createdAt)}
                                                    </span>
                                                </span>
                                            </a>
                                            {canEdit ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        verwijder(item.id)
                                                    }
                                                    className="text-gray-400 hover:text-red-600 text-sm shrink-0 px-2"
                                                    title="Verwijderen"
                                                >
                                                    ✕
                                                </button>
                                            ) : null}
                                        </SpecListRow>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </SpecPanel>
        </SpecPageCard>
    );
}
