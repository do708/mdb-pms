"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";

import { BudgetBadge } from "@/components/projects/ProjectBudget";

interface ProjectSummary {
    id: string;
    number: string;
    name: string;
    location: string | null;
    status: string;
    customer: {
        id: string;
        name: string;
        color?: string;
    };
    geoffreerdeUren: number;
    geoffreerdBedrag: number;
    gebruikteUren: number;
    materiaalKosten: number;
}

function isActiveProject(status: string): boolean {
    return status === "actief" || status === "new";
}

function groupByCustomer(projects: ProjectSummary[]) {
    const map = new Map<string, ProjectSummary[]>();

    for (const project of projects) {
        const key = project.customer.id;
        const list = map.get(key) || [];

        list.push(project);
        map.set(key, list);
    }

    return Array.from(map.entries()).map(([customerId, items]) => ({
        customerId,
        customerName: items[0]?.customer.name || "Onbekend",
        customerColor: items[0]?.customer.color,
        items,
    }));
}

function statusLabel(status: string): string {
    if (status === "actief" || status === "new") {
        return "Actief";
    }

    if (status === "afgerond") {
        return "Afgerond";
    }

    return status;
}

function todayIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
}

export default function ProjectsPage() {
    const { data: session } = useSession();
    const role = session?.user?.role || "";

    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

    const [urenProjectId, setUrenProjectId] = useState("");
    const [urenDatum, setUrenDatum] = useState(todayIso());
    const [urenAantal, setUrenAantal] = useState("");
    const [urenOmschrijving, setUrenOmschrijving] = useState("");
    const [urenSaving, setUrenSaving] = useState(false);
    const [engineers, setEngineers] = useState<
        { id: string; name: string | null }[]
    >([]);
    const [geselecteerdeMonteurs, setGeselecteerdeMonteurs] = useState<
        string[]
    >([]);

    async function loadProjects() {
        const response = await fetch("/api/projects");
        const data = await response.json();

        setProjects(data);
        setLoading(false);
    }

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (role !== "engineer") {
            return;
        }

        fetch("/api/engineers")
            .then((r) => r.json())
            .then((list) => {
                setEngineers(Array.isArray(list) ? list : []);
            })
            .catch(console.error);
    }, [role]);

    useEffect(() => {
        if (role !== "engineer" || !session?.user?.id) {
            return;
        }

        if (geselecteerdeMonteurs.length === 0) {
            setGeselecteerdeMonteurs([session.user.id]);
        }
    }, [role, session?.user?.id, engineers]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();

        return projects.filter((project) => {
            const haystack = `${project.name} ${project.location || ""} ${project.customer.name} ${project.number}`
                .toLowerCase()
                .trim();

            return haystack.includes(q);
        });
    }, [projects, search]);

    const groupedActive = useMemo(
        () =>
            groupByCustomer(
                filtered.filter((p) => isActiveProject(p.status))
            ),
        [filtered]
    );

    const groupedCompleted = useMemo(
        () =>
            groupByCustomer(
                filtered.filter((p) => !isActiveProject(p.status))
            ),
        [filtered]
    );

    const activeProjects = projects.filter((p) =>
        isActiveProject(p.status)
    );

    async function boekUren() {
        if (!urenProjectId || !urenAantal) {
            alert("Kies een project en vul het aantal uren in");
            return;
        }

        if (geselecteerdeMonteurs.length === 0) {
            alert("Selecteer minimaal één monteur");
            return;
        }

        setUrenSaving(true);

        try {
            const response = await fetch(
                `/api/projects/${urenProjectId}/uren`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        datum: urenDatum,
                        uren: urenAantal,
                        omschrijving: urenOmschrijving,
                        userIds: geselecteerdeMonteurs,
                    }),
                }
            );

            if (!response.ok) {
                const err = await response.json();
                alert(err.error || "Uren boeken mislukt");
                return;
            }

            setUrenAantal("");
            setUrenOmschrijving("");
            if (session?.user?.id) {
                setGeselecteerdeMonteurs([session.user.id]);
            }
            await loadProjects();

            const projectNaam =
                activeProjects.find((p) => p.id === urenProjectId)?.name ||
                "het project";

            const openDetail = confirm(
                `Uren opgeslagen op "${projectNaam}". Projectpagina openen om het overzicht te zien?`
            );

            if (openDetail) {
                window.location.href = `/projects/${urenProjectId}`;
            }
        } catch (error) {
            console.error(error);
            alert("Er ging iets fout");
        } finally {
            setUrenSaving(false);
        }
    }

    const isOffice = role === "admin" || role === "office";

    function folderKey(section: "active" | "completed", customerId: string) {
        return `${section}:${customerId}`;
    }

    function renderProjectFolders(
        section: "active" | "completed",
        groups: ReturnType<typeof groupByCustomer>,
        emptyMessage: string
    ) {
        if (groups.length === 0) {
            return (
                <p className="p-5 bg-white border rounded-xl text-gray-500 text-sm">
                    {emptyMessage}
                </p>
            );
        }

        return (
            <div className="space-y-3">
                {groups.map((group) => {
                    const key = folderKey(section, group.customerId);
                    const open = openFolders[key] !== false;

                    return (
                        <div
                            key={key}
                            className="bg-white border rounded-2xl overflow-hidden"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenFolders((prev) => ({
                                        ...prev,
                                        [key]: !open,
                                    }))
                                }
                                className="w-full flex items-center gap-3 px-5 py-4 min-h-[52px] hover:bg-gray-50 active:bg-gray-100 text-left"
                            >
                                {open ? (
                                    <ChevronDown size={20} />
                                ) : (
                                    <ChevronRight size={20} />
                                )}

                                <Folder
                                    size={20}
                                    style={{
                                        color:
                                            group.customerColor ||
                                            (section === "completed"
                                                ? "#6b7280"
                                                : "#2563eb"),
                                    }}
                                />

                                <div className="flex-1">
                                    <div className="font-bold">
                                        {group.customerName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {group.items.length} project
                                        {group.items.length === 1 ? "" : "en"}
                                    </div>
                                </div>
                            </button>

                            {open ? (
                                <div className="divide-y border-t">
                                    {group.items.map((project) => (
                                        <Link
                                            key={project.id}
                                            href={`/projects/${project.id}`}
                                            className="block px-5 py-4 pl-10 sm:pl-12 hover:bg-[#fce7f3]/40 active:bg-[#fce7f3]/60"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div>
                                                    <h2 className="font-bold">
                                                        {project.name}
                                                        {project.location ? (
                                                            <span className="font-normal text-gray-600">
                                                                {" "}
                                                                ·{" "}
                                                                {
                                                                    project.location
                                                                }
                                                            </span>
                                                        ) : null}
                                                    </h2>
                                                    <p className="text-sm text-gray-500">
                                                        {project.number}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg">
                                                        {statusLabel(
                                                            project.status
                                                        )}
                                                    </span>
                                                    {isOffice ? (
                                                        <BudgetBadge
                                                            gebruikt={
                                                                project.gebruikteUren
                                                            }
                                                            geoffreerd={
                                                                project.geoffreerdeUren ||
                                                                null
                                                            }
                                                            eenheid="uur"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-medium text-gray-700 bg-gray-50 border rounded-lg px-2 py-1">
                                                            {project.gebruikteUren.toFixed(
                                                                1
                                                            )}{" "}
                                                            uur geboekt
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-6 -m-2 sm:-m-0">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Projecten</h1>
                    <p className="text-gray-500">
                        {isOffice
                            ? "Grotere klussen met uren, offerte en materialen per opdrachtgever"
                            : "Openstaande projecten — uren boeken en overzicht per monteur"}
                    </p>
                </div>

                {isOffice ? (
                    <Link
                        href="/projects/new"
                        className="bg-[#d6007e] text-white px-5 py-4 min-h-[48px] rounded-xl font-bold text-center w-full sm:w-auto flex items-center justify-center"
                    >
                        + Nieuw project
                    </Link>
                ) : null}
            </header>

            {role === "engineer" ? (
                <section className="bg-white border rounded-2xl p-5 space-y-4">
                    <h2 className="font-bold text-lg">Uren boeken</h2>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                            <span className="text-sm font-medium text-gray-700 mb-1 block">
                                Project
                            </span>
                            <select
                                value={urenProjectId}
                                onChange={(e) =>
                                    setUrenProjectId(e.target.value)
                                }
                                className="border rounded-xl p-3 w-full min-h-[48px] bg-white"
                            >
                            <option value="">Kies project</option>
                            {activeProjects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                    {p.location ? ` — ${p.location}` : ""}
                                </option>
                            ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 mb-1 block">
                                Datum
                            </span>
                            <input
                                type="date"
                                value={urenDatum}
                                onChange={(e) => setUrenDatum(e.target.value)}
                                className="border rounded-xl p-3 w-full min-h-[48px] bg-white"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 mb-1 block">
                                Uren
                            </span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={urenAantal}
                                onChange={(e) => setUrenAantal(e.target.value)}
                                placeholder="Bijv. 4 of 1.30"
                                className="border rounded-xl p-3 w-full min-h-[48px] bg-white"
                            />
                        </label>

                        <div className="sm:col-span-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    Monteurs (meerdere mogelijk)
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setGeselecteerdeMonteurs(
                                            engineers.map((e) => e.id)
                                        )
                                    }
                                    className="text-xs text-[#d6007e] font-medium"
                                >
                                    Alles selecteren
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {engineers.map((eng) => {
                                    const checked =
                                        geselecteerdeMonteurs.includes(eng.id);
                                    const label =
                                        eng.name?.trim() || "Monteur";

                                    return (
                                        <label
                                            key={eng.id}
                                            className={`
                                                inline-flex items-center gap-2
                                                px-3 py-2 rounded-xl border
                                                cursor-pointer text-sm min-h-[44px]
                                                ${
                                                    checked
                                                        ? "bg-[#fce7f3] border-[#d6007e] text-[#d6007e]"
                                                        : "bg-white border-gray-200"
                                                }
                                            `}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    setGeselecteerdeMonteurs(
                                                        (prev) =>
                                                            prev.includes(
                                                                eng.id
                                                            )
                                                                ? prev.filter(
                                                                      (id) =>
                                                                          id !==
                                                                          eng.id
                                                                  )
                                                                : [
                                                                      ...prev,
                                                                      eng.id,
                                                                  ]
                                                    )
                                                }
                                                className="rounded"
                                            />
                                            {label}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <label className="block sm:col-span-2">
                            <span className="text-sm font-medium text-gray-700 mb-1 block">
                                Omschrijving (optioneel)
                            </span>
                            <input
                                value={urenOmschrijving}
                                onChange={(e) =>
                                    setUrenOmschrijving(e.target.value)
                                }
                                placeholder="Wat heb je gedaan?"
                                className="border rounded-xl p-3 w-full min-h-[48px] bg-white"
                            />
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={boekUren}
                        disabled={urenSaving}
                        className="w-full bg-[#d6007e] text-white rounded-xl px-6 py-4 min-h-[48px] font-bold text-base disabled:opacity-60"
                    >
                        {urenSaving ? "Opslaan…" : "Uren opslaan"}
                    </button>
                </section>
            ) : null}

            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoeken op project, locatie of opdrachtgever…"
                className="w-full border rounded-xl p-3 min-h-[48px] bg-white"
            />

            <div className="space-y-8">
                <div className="space-y-3">
                    <h2 className="text-lg font-bold">Lopende projecten</h2>
                    {loading
                        ? (
                            <p className="p-5 bg-white border rounded-xl">
                                Projecten laden…
                            </p>
                        )
                        : renderProjectFolders(
                              "active",
                              groupedActive,
                              "Geen lopende projecten gevonden."
                          )}
                </div>

                {isOffice ? (
                <div className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-700">
                        Afgeronde projecten
                    </h2>
                    {loading
                        ? null
                        : renderProjectFolders(
                              "completed",
                              groupedCompleted,
                              "Nog geen afgeronde projecten."
                          )}
                </div>
                ) : null}
            </div>
        </div>
    );
}
