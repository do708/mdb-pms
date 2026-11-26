"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Trash2, Upload } from "lucide-react";

type Props = {
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean;
};

/**
 * Mobielvriendelijke foto-dropzone voor gereedschap:
 * maken / galerij / slepen → upload via /api/upload → pad/URL opslaan.
 */
export default function GereedschapPhotoField({
    value,
    onChange,
    disabled = false,
}: Props) {
    const cameraRef = useRef<HTMLInputElement | null>(null);
    const galleryRef = useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    async function uploadFile(file: File) {
        if (disabled || uploading) return;
        if (!file.type.startsWith("image/") && file.size === 0) {
            setError("Kies een afbeelding");
            return;
        }

        setError("");
        setUploading(true);
        try {
            const body = new FormData();
            body.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body,
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.url) {
                setError(
                    typeof data.error === "string" && data.error.trim()
                        ? data.error
                        : "Upload mislukt"
                );
                return;
            }

            onChange(String(data.url));
        } catch {
            setError("Upload mislukt (netwerk of server)");
        } finally {
            setUploading(false);
        }
    }

    function onFileInput(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];
        if (file) void uploadFile(file);
        event.target.value = "";
    }

    return (
        <div className="space-y-2 sm:col-span-2">
            <span className="text-sm text-gray-600">Foto (optioneel)</span>

            {value ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={value}
                        alt="Gereedschapfoto"
                        className="mx-auto max-h-56 w-full object-contain bg-white sm:max-h-64"
                    />
                    <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white p-2">
                        <button
                            type="button"
                            disabled={disabled || uploading}
                            onClick={() => cameraRef.current?.click()}
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <Camera className="h-4 w-4" />
                            Nieuwe foto
                        </button>
                        <button
                            type="button"
                            disabled={disabled || uploading}
                            onClick={() => galleryRef.current?.click()}
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <ImagePlus className="h-4 w-4" />
                            Galerij
                        </button>
                        <button
                            type="button"
                            disabled={disabled || uploading}
                            onClick={() => onChange("")}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            aria-label="Foto verwijderen"
                        >
                            <Trash2 className="h-4 w-4" />
                            Weg
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (!disabled) setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        if (disabled || uploading) return;
                        const file = Array.from(e.dataTransfer.files || []).find(
                            (f) =>
                                f.type.startsWith("image/") ||
                                /\.(jpe?g|png|webp|gif|heic)$/i.test(f.name)
                        );
                        if (file) void uploadFile(file);
                    }}
                    className={`rounded-2xl border-2 border-dashed p-4 text-center transition sm:p-6 ${
                        dragging
                            ? "border-[#0066FF] bg-sky-50"
                            : "border-slate-300 bg-white"
                    } ${disabled ? "opacity-50" : ""}`}
                >
                    <Upload
                        className="mx-auto mb-2 h-8 w-8 text-[#0066FF]"
                        aria-hidden
                    />
                    <p className="text-sm font-medium text-slate-800">
                        {uploading
                            ? "Bezig met uploaden…"
                            : "Foto maken of toevoegen"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Op telefoon: camera of galerij. Op desktop: slepen of
                        kiezen.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                            type="button"
                            disabled={disabled || uploading}
                            onClick={() => cameraRef.current?.click()}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            <Camera className="h-5 w-5" />
                            Maak foto
                        </button>
                        <button
                            type="button"
                            disabled={disabled || uploading}
                            onClick={() => galleryRef.current?.click()}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <ImagePlus className="h-5 w-5" />
                            Kies uit galerij
                        </button>
                    </div>
                </div>
            )}

            <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={disabled || uploading}
                onChange={onFileInput}
            />
            <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled || uploading}
                onChange={onFileInput}
            />

            {error ? (
                <p className="text-sm text-red-600">{error}</p>
            ) : null}
        </div>
    );
}
