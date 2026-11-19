"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
    PageHeader,
    PageShell,
    SpecFieldLabel,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
    specInputClassName,
} from "@/components/ui/SpecLayout";

interface Klus {
    id: string;
    number: string;
    title: string;
    status: string;
    plannedDate: string | null;
    city: string | null;
    customer: { name: string } | null;
    assignedUser: { name: string | null } | null;
}

interface TeKoppelenPakbon {
    id: string;
    originalName: string | null;
    filename: string | null;
    createdAt: string;
}

export default function PakbonnenPage() {
    const { data: session } = useSession();
    const role = session?.user?.role ?? "";
    const allowed =
        role === "admin" || role === "office" || role === "magazijn";

    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [klussen, setKlussen] = useState<Klus[]>([]);
    const [teKoppelen, setTeKoppelen] = useState<TeKoppelenPakbon[]>([]);
    const [actievePakbonId, setActievePakbonId] = useState<string | null>(null);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [q, setQ] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");

    async function laadLijst() {
        const response = await fetch("/api/pakbonnen");
        if (!response.ok) {
            return;
        }
        const data = await response.json();
        setKlussen(data.workorders ?? []);
        setTeKoppelen(data.teKoppelen ?? []);
    }

    useEffect(() => {
        void laadLijst();
    }, []);

    const gefilterd = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) {
            return klussen;
        }
        return klussen.filter((klus) =>
            [
                klus.number,
                klus.title,
                klus.city,
                klus.customer?.name,
                klus.assignedUser?.name,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(needle)
        );
    }, [klussen, q]);

    const gekozen = Object.entries(selected)
        .filter(([, on]) => on)
        .map(([id]) => id);

    function takeFiles(list: FileList | File[] | null) {
        const next = list ? Array.from(list)[0] : null;
        if (next) {
            setFile(next);
            setError("");
            setOk("");
        }
    }

    async function koppelBestaande() {
        if (!actievePakbonId) {
            setError("Kies eerst een pakbon om te koppelen");
            return;
        }
        if (gekozen.length === 0) {
            setError("Selecteer minstens één klus");
            return;
        }

        setBusy(true);
        setError("");
        setOk("");

        try {
            const response = await fetch(`/api/pakbonnen/${actievePakbonId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workorderIds: gekozen }),
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data.error || "Koppelen mislukt");
                return;
            }

            setOk(
                `Pakbon gekoppeld aan ${data.count} klus${
                    data.count === 1 ? "" : "sen"
                }. Die klussen staan niet meer in de lijst hieronder.`
            );
            setActievePakbonId(null);
            setSelected({});
            await laadLijst();
        } catch {
            setError("Koppelen mislukt");
        } finally {
            setBusy(false);
        }
    }

    async function opslaan() {
        if (!file) {
            setError("Sleep of kies eerst een pakbon");
            return;
        }
        if (gekozen.length === 0) {
            setError("Selecteer minstens één klus");
            return;
        }

        setBusy(true);
        setError("");
        setOk("");

        try {
            const body = new FormData();
            body.append("file", file);
            for (const id of gekozen) {
                body.append("workorderIds", id);
            }

            const response = await fetch("/api/pakbonnen", {
                method: "POST",
                body,
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data.error || "Uploaden mislukt");
                return;
            }

            setOk(
                `Pakbon gekoppeld aan ${data.count} klus${
                    data.count === 1 ? "" : "sen"
                }. Die klussen staan niet meer in de lijst hieronder.`
            );
            setFile(null);
            setSelected({});
            await laadLijst();
        } catch {
            setError("Uploaden mislukt");
        } finally {
            setBusy(false);
        }
    }

    if (!allowed) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Geen toegang</p>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <PageHeader
                title="Pakbon uploaden"
                subtitle="Sleep de pakbon hierheen en koppel die aan een of meer klussen. Eén pakbon mag bij meerdere klussen horen. Gekoppelde klussen verdwijnen uit deze lijst; de pakbon blijft zichtbaar op elke gekoppelde werkbon."
            />

            <SpecPanel title="Pakbon" tone="slate">
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        takeFiles(e.dataTransfer.files);
                    }}
                    onClick={() => inputRef.current?.click()}
                    className={`
                        cursor-pointer rounded-2xl border-2 border-dashed px-4 py-10
                        text-center transition
                        ${
                            dragging
                                ? "border-sky-400 bg-sky-50"
                                : "border-slate-300 bg-white hover:bg-slate-50"
                        }
                    `}
                >
                    <p className="text-sm font-medium text-slate-800">
                        Sleep de pakbon hierheen of klik om te kiezen
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        PDF of foto. Daarna kies je hieronder de klussen.
                    </p>
                    {file ? (
                        <p className="text-sm text-sky-800 mt-3 font-medium">
                            Gekozen: {file.name}
                        </p>
                    ) : null}
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            takeFiles(e.target.files);
                            e.target.value = "";
                        }}
                    />
                </div>
            </SpecPanel>

            {teKoppelen.length > 0 ? (
                <SpecPageCard>
                    <h2 className="font-semibold text-sm text-gray-800">
                        Nog te koppelen pakbonnen
                    </h2>
                    <p className="text-xs text-gray-500">
                        Deze bestanden horen nog bij geen klus. Kies er één en
                        koppel hieronder aan een of meer opdrachten.
                    </p>
                    <div className="space-y-1">
                        {teKoppelen.map((pakbon) => {
                            const active = actievePakbonId === pakbon.id;
                            return (
                                <button
                                    key={pakbon.id}
                                    type="button"
                                    onClick={() => {
                                        setActievePakbonId(
                                            active ? null : pakbon.id
                                        );
                                        setFile(null);
                                        setOk("");
                                        setError("");
                                    }}
                                    className={`
                                        w-full text-left rounded-xl border px-3 py-2 text-sm
                                        ${
                                            active
                                                ? "border-sky-400 bg-sky-50"
                                                : "border-slate-200 bg-white"
                                        }
                                    `}
                                >
                                    {pakbon.originalName ||
                                        pakbon.filename ||
                                        "Pakbon"}
                                </button>
                            );
                        })}
                    </div>
                    {actievePakbonId ? (
                        <button
                            type="button"
                            onClick={() => void koppelBestaande()}
                            disabled={busy}
                            className="bg-[#d6007e] text-white rounded-xl px-5 py-2.5 font-semibold disabled:opacity-50"
                        >
                            {busy
                                ? "Bezig…"
                                : `Bestaande pakbon koppelen${
                                      gekozen.length
                                          ? ` (${gekozen.length})`
                                          : ""
                                  }`}
                        </button>
                    ) : null}
                </SpecPageCard>
            ) : null}

            <SpecPageCard>
                <h2 className="font-semibold text-sm text-gray-800">
                    Koppelen aan klus(sen)
                </h2>
                <p className="text-xs text-gray-500">
                    Alleen klussen zonder pakbon. Vink alle klussen aan die bij
                    dezelfde pakbon horen.
                </p>
                <label className="block max-w-md">
                    <SpecFieldLabel>Zoeken</SpecFieldLabel>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Nummer, locatie, opdrachtgever, monteur"
                        className={specInputClassName}
                    />
                </label>

                <div className="space-y-1 max-h-[420px] overflow-y-auto">
                    {gefilterd.map((klus) => {
                        const checked = Boolean(selected[klus.id]);
                        return (
                            <label key={klus.id} className="block">
                                <SpecListRow
                                    className={`
                                        flex items-center gap-3 cursor-pointer
                                        ${checked ? "bg-sky-50" : ""}
                                    `}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) =>
                                            setSelected((prev) => ({
                                                ...prev,
                                                [klus.id]: e.target.checked,
                                            }))
                                        }
                                        className="h-4 w-4 accent-sky-600"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {klus.number} — {klus.title}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {klus.customer?.name ?? "—"}
                                            {klus.city ? ` · ${klus.city}` : ""}
                                            {klus.assignedUser?.name
                                                ? ` · ${klus.assignedUser.name}`
                                                : ""}
                                            {klus.plannedDate
                                                ? ` · ${new Date(
                                                      klus.plannedDate
                                                  ).toLocaleDateString("nl-NL")}`
                                                : ""}
                                        </p>
                                    </div>
                                </SpecListRow>
                            </label>
                        );
                    })}
                    {gefilterd.length === 0 ? (
                        <p className="text-sm text-gray-400 px-1">
                            Geen klussen zonder pakbon gevonden.
                        </p>
                    ) : null}
                </div>

                {error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : null}
                {ok ? (
                    <p className="text-sm text-emerald-700">{ok}</p>
                ) : null}

                <button
                    type="button"
                    onClick={() => void opslaan()}
                    disabled={busy}
                    className="bg-[#d6007e] text-white rounded-xl px-5 py-2.5 font-semibold disabled:opacity-50"
                >
                    {busy
                        ? "Bezig…"
                        : `Uploaden en koppelen${
                              gekozen.length
                                  ? ` (${gekozen.length})`
                                  : ""
                          }`}
                </button>
            </SpecPageCard>
        </PageShell>
    );
}
