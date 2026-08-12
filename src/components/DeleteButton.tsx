"use client";

import { useEffect, useState } from "react";

interface Props {
    // Endpoint dat de DELETE ontvangt, bijv. /api/customers/123
    url: string;

    // Waar het over gaat, voor de bevestiging: "klant Axians"
    label: string;

    // Aangeroepen na een geslaagde verwijdering
    onDeleted: () => void;

    // Compacte variant (icoon) voor in lijstrijen
    compact?: boolean;

    // Zelfde hoogte als andere toolbar-knoppen (export, wijzigen)
    toolbar?: boolean;

    // Tooltip / title op de knop (bijv. "Prullenbak")
    title?: string;
}

export default function DeleteButton({
    url,
    label,
    onDeleted,
    compact = false,
    toolbar = false,
    title = "Verwijderen",
}: Props) {
    const [busy, setBusy] = useState(false);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (!confirming) {
            return;
        }

        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) {
                setConfirming(false);
            }
        }

        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [confirming, busy]);

    async function remove() {
        setBusy(true);

        try {
            const response = await fetch(url, {
                method: "DELETE",
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                // Server kan besluiten te deactiveren i.p.v. verwijderen
                if (data.message) {
                    alert(data.message);
                }

                onDeleted();
            } else {
                alert(data.error ?? "Verwijderen mislukt");
            }
        } finally {
            setBusy(false);
            setConfirming(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirming(true);
                }}
                title={title}
                aria-label={title}
                className={
                    compact
                        ? "text-red-500 hover:text-red-700 text-lg px-2"
                        : toolbar
                          ? "text-sm font-bold text-red-700 border border-red-300 rounded-xl px-4 py-3 min-h-[48px] hover:bg-red-50 flex items-center justify-center"
                          : "text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
                }
            >
                {compact ? "🗑" : title}
            </button>

            {confirming ? (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
                    role="presentation"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!busy) {
                            setConfirming(false);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-dialog-title"
                        className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-gray-100 p-5 space-y-4"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <div className="space-y-1">
                            <h2
                                id="delete-dialog-title"
                                className="text-base font-semibold text-gray-900"
                            >
                                Verwijderen?
                            </h2>
                            <p className="text-sm text-gray-600 leading-relaxed break-words">
                                Weet je zeker dat je{" "}
                                <span className="font-medium text-gray-900">
                                    {label}
                                </span>{" "}
                                wilt verwijderen? Dit kan niet ongedaan worden
                                gemaakt.
                            </p>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirming(false)}
                                disabled={busy}
                                className="
                                    text-sm font-medium
                                    rounded-xl px-4 py-2.5 min-h-[44px]
                                    border border-gray-200 text-gray-700
                                    hover:bg-gray-50
                                    disabled:opacity-50
                                "
                            >
                                Annuleren
                            </button>

                            <button
                                type="button"
                                onClick={remove}
                                disabled={busy}
                                className="
                                    text-sm font-semibold
                                    rounded-xl px-4 py-2.5 min-h-[44px]
                                    bg-red-600 text-white
                                    hover:bg-red-700
                                    disabled:opacity-50
                                "
                            >
                                {busy ? "Bezig…" : "Verwijderen"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
