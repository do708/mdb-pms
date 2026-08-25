"use client";

import { useRef, useState } from "react";

import {
    SpecListRow,
    SpecPageCard,
} from "@/components/ui/SpecLayout";

export interface ProjectBijlage {
    id: string;
    url: string;
    filename: string | null;
    originalName: string | null;
    contentType: string | null;
    createdAt: string;
}

interface Props {
    projectId: string;
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

    if (n.match(/\.(dwg|dxf)$/)) {
        return "📐";
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

export default function ProjectPlattegronden({
    projectId,
    items,
    canEdit = false,
    onChanged,
}: Props) {
    const [bezig, setBezig] = useState(false);
    const [sleepActief, setSleepActief] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    async function uploadBestanden(bestanden: FileList | File[]) {
        const lijst = Array.from(bestanden);

        if (lijst.length === 0) {
            return;
        }

        setBezig(true);

        try {
            for (const file of lijst) {
                const body = new FormData();
                body.append("file", file);

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
                            : "Uploaden mislukt"
                    );
                }
            }

            await onChanged?.();
        } finally {
            setBezig(false);
        }
    }

    async function verwijder(id: string) {
        if (!confirm("Deze plattegrond verwijderen?")) {
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
        <SpecPageCard className="space-y-3">
            <div className="space-y-0.5 border-b pb-1">
                <h2 className="font-semibold text-sm text-gray-800">
                    Plattegronden &amp; tekeningen
                </h2>
                <p className="text-xs text-gray-500 leading-snug">
                    Monteurs zien hier altijd de nieuwste tekeningen van dit
                    project.
                </p>
            </div>

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
                            uploadBestanden(e.dataTransfer.files);
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
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.dxf,application/pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files?.length) {
                                uploadBestanden(e.target.files);
                            }
                            e.target.value = "";
                        }}
                    />
                    <div className="text-2xl mb-1" aria-hidden>
                        📐
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                        {bezig
                            ? "Bezig met opslaan..."
                            : "Sleep plattegronden hierheen of klik om te kiezen"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        PDF, foto of tekening
                    </p>
                </div>
            ) : null}

            {items.length === 0 ? (
                <p className="text-sm text-gray-500">
                    Nog geen plattegronden geüpload.
                </p>
            ) : (
                <ul className="space-y-2">
                    {items.map((item, index) => {
                        const naam =
                            item.originalName
                            ?? item.filename
                            ?? "bestand";
                        const nieuwste = index === 0;

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
                                            <span className="flex items-center gap-2 min-w-0">
                                                <span className="block text-sm font-medium text-gray-900 truncate">
                                                    {naam}
                                                </span>
                                                {nieuwste ? (
                                                    <span className="shrink-0 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-1.5 py-0.5">
                                                        Nieuwste
                                                    </span>
                                                ) : null}
                                            </span>
                                            <span className="block text-xs text-gray-500">
                                                {datumNL(item.createdAt)}
                                            </span>
                                        </span>
                                    </a>

                                    {canEdit ? (
                                        <button
                                            type="button"
                                            onClick={() => verwijder(item.id)}
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
        </SpecPageCard>
    );
}
