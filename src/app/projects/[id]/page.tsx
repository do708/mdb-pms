"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

import DeleteButton from "@/components/DeleteButton";
import {
    BudgetBadge,
    ProgressBar,
} from "@/components/projects/ProjectBudget";
import { formatHoursDisplay } from "@/lib/hours";

interface ProjectDetail {
    id: string;
    number: string;
    name: string;
    location: string | null;
    plaats: string | null;
    status: string;
    customerId: string;
    customer: { id: string; name: string };
    geoffreerdeUren: number;
    geoffreerdBedrag: number;
    offerteUrl: string | null;
    offerteFilename: string | null;
    termijn1Gefactureerd: boolean;
    termijn2Gefactureerd: boolean;
    termijn3Gefactureerd: boolean;
    termijn4Gefactureerd: boolean;
    termijn1GefactureerdOp: string | null;
    termijn2GefactureerdOp: string | null;
    termijn3GefactureerdOp: string | null;
    termijn4GefactureerdOp: string | null;
    gebruikteUren: number;
    materiaalKosten: number;
    uren: {
        id: string;
        datum: string;
        uren: number;
        omschrijving: string | null;
        kilometers: number | null;
        createdAt: string;
        user: { id: string; name: string | null; email: string };
        bookedBy: {
            id: string;
            name: string | null;
            email: string;
        } | null;
    }[];
    materialen: {
        id: string;
        omschrijving: string;
        factuurnummer: string | null;
        leverancier: string | null;
        kosten: number;
        ingekochtOp: string | null;
    }[];
    workorders: {
        id: string;
        number: string;
        title: string;
        status: string;
    }[];
}

interface Customer {
    id: string;
    name: string;
}

interface EngineerOption {
    id: string;
    name: string | null;
}

function monteurLabel(user: {
    name: string | null;
    email: string;
}): string {
    return user.name?.trim() || user.email;
}

function formatDate(value: string): string {
    const d = new Date(value);

    return d.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatDateTime(value: string): string {
    const d = new Date(value);

    return d.toLocaleString("nl-NL", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatEuro(value: number): string {
    return new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR",
    }).format(value);
}

function todayIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
}

export default function ProjectDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { data: session } = useSession();
    const role = session?.user?.role || "";
    const isOffice = role === "admin" || role === "office";

    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [plaats, setPlaats] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [status, setStatus] = useState("actief");
    const [geoffreerdeUren, setGeoffreerdeUren] = useState("");
    const [geoffreerdBedrag, setGeoffreerdBedrag] = useState("");

    const [urenDatum, setUrenDatum] = useState(todayIso());
    const [urenAantal, setUrenAantal] = useState("");
    const [urenOmschrijving, setUrenOmschrijving] = useState("");
    const [geselecteerdeMonteurs, setGeselecteerdeMonteurs] = useState<
        string[]
    >([]);
    const [engineers, setEngineers] = useState<EngineerOption[]>([]);

    const [matOmschrijving, setMatOmschrijving] = useState("");
    const [matFactuurnummer, setMatFactuurnummer] = useState("");
    const [matLeverancier, setMatLeverancier] = useState("");
    const [matKosten, setMatKosten] = useState("");
    const [matDatum, setMatDatum] = useState("");

    const [offerteUploading, setOfferteUploading] = useState(false);
    const [editingBasics, setEditingBasics] = useState(false);
    const [completing, setCompleting] = useState(false);

    const projectIsActive =
        project?.status === "actief" || project?.status === "new";

    function resetFormFromProject(data: ProjectDetail) {
        setName(data.name);
        setLocation(data.location || "");
        setPlaats(data.plaats || "");
        setCustomerId(data.customerId);
        setStatus(data.status === "new" ? "actief" : data.status);
        setGeoffreerdeUren(
            data.geoffreerdeUren ? String(data.geoffreerdeUren) : ""
        );
        setGeoffreerdBedrag(
            data.geoffreerdBedrag ? String(data.geoffreerdBedrag) : ""
        );
    }

    function startEditingBasics() {
        resetFormFromProject(project!);
        setEditingBasics(true);
    }

    function cancelEditingBasics() {
        if (project) {
            resetFormFromProject(project);
        }
        setEditingBasics(false);
    }

    async function loadProject() {
        const response = await fetch(`/api/projects/${id}`);
        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Project laden mislukt");
            setLoading(false);
            return;
        }

        setProject(data);
        resetFormFromProject(data);
        setLoading(false);
    }

    useEffect(() => {
        loadProject();
    }, [id]);

    useEffect(() => {
        if (role !== "admin" && role !== "office" && role !== "engineer") {
            return;
        }

        if (role === "admin" || role === "office") {
            fetch("/api/customers")
                .then((r) => r.json())
                .then(setCustomers)
                .catch(console.error);
        }

        fetch("/api/engineers")
            .then((r) => r.json())
            .then((list: EngineerOption[]) => {
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

    const urenPerMonteur = useMemo(() => {
        if (!project) {
            return [];
        }

        const map = new Map<
            string,
            { naam: string; totaal: number; regels: number; km: number }
        >();

        for (const row of project.uren) {
            const key = monteurLabel(row.user);
            const bestaand = map.get(key) || {
                naam: key,
                totaal: 0,
                regels: 0,
                km: 0,
            };

            bestaand.totaal += row.uren;
            bestaand.regels += 1;
            bestaand.km += row.kilometers ?? 0;
            map.set(key, bestaand);
        }

        return Array.from(map.values()).sort((a, b) =>
            a.naam.localeCompare(b.naam, "nl")
        );
    }, [project]);

    function toggleMonteur(userId: string) {
        setGeselecteerdeMonteurs((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    }

    function selecteerAlleMonteurs() {
        setGeselecteerdeMonteurs(engineers.map((e) => e.id));
    }

    async function saveBasics() {
        if (!location.trim() || !plaats.trim()) {
            const ok = window.confirm(
                "Adres en/of plaats ontbreekt. Toch opslaan?"
            );
            if (!ok) {
                return;
            }
        }

        setSaving(true);

        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    location,
                    plaats,
                    customerId,
                    status,
                    geoffreerdeUren,
                    geoffreerdBedrag,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Opslaan mislukt");
                return;
            }

        setProject(data);
        resetFormFromProject(data);
        setEditingBasics(false);
        alert("Opgeslagen");
        } catch (error) {
            console.error(error);
            alert("Er ging iets fout");
        } finally {
            setSaving(false);
        }
    }

    async function markeerProjectAfgerond() {
        if (
            !confirm(
                `Project "${project?.name}" als afgerond markeren? Het komt dan onder Afgeronde projecten op de projectenpagina.`
            )
        ) {
            return;
        }

        setCompleting(true);

        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "afgerond" }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Project afronden mislukt");
                return;
            }

            setProject(data);
            resetFormFromProject(data);
            setEditingBasics(false);
        } catch (error) {
            console.error(error);
            alert("Er ging iets fout");
        } finally {
            setCompleting(false);
        }
    }

    async function uploadOfferte(file: File) {
        setOfferteUploading(true);

        try {
            const form = new FormData();
            form.append("file", file);

            const upload = await fetch("/api/upload", {
                method: "POST",
                body: form,
            });

            const uploadData = await upload.json();

            if (!upload.ok || !uploadData.url) {
                alert(uploadData.error || "Upload mislukt");
                return;
            }

            const patch = await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    offerteUrl: uploadData.url,
                    offerteFilename: file.name,
                }),
            });

            const data = await patch.json();

            if (!patch.ok) {
                alert(data.error || "Koppelen mislukt");
                return;
            }

            setProject(data);
        } catch (error) {
            console.error(error);
            alert("Upload mislukt");
        } finally {
            setOfferteUploading(false);
        }
    }

    async function toggleTermijnGefactureerd(
        key:
            | "termijn1Gefactureerd"
            | "termijn2Gefactureerd"
            | "termijn3Gefactureerd"
            | "termijn4Gefactureerd",
        checked: boolean
    ) {
        if (!project) {
            return;
        }

        const dateKey =
            `${key}Op` as
                | "termijn1GefactureerdOp"
                | "termijn2GefactureerdOp"
                | "termijn3GefactureerdOp"
                | "termijn4GefactureerdOp";

        const previousChecked = project[key];
        const previousDate = project[dateKey];
        const nextDate = checked ? todayIso() : null;

        setProject({
            ...project,
            [key]: checked,
            [dateKey]: nextDate,
        });
        setSaving(true);

        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    [key]: checked,
                    [dateKey]: nextDate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setProject({
                    ...project,
                    [key]: previousChecked,
                    [dateKey]: previousDate,
                });
                alert(data.error || "Opslaan mislukt");
                return;
            }

            setProject(data);
        } catch (error) {
            console.error(error);
            setProject({
                ...project,
                [key]: previousChecked,
                [dateKey]: previousDate,
            });
            alert("Opslaan mislukt");
        } finally {
            setSaving(false);
        }
    }

    async function setTermijnGefactureerdDatum(
        dateKey:
            | "termijn1GefactureerdOp"
            | "termijn2GefactureerdOp"
            | "termijn3GefactureerdOp"
            | "termijn4GefactureerdOp",
        value: string
    ) {
        if (!project) {
            return;
        }

        const key =
            dateKey.replace(/Op$/, "") as
                | "termijn1Gefactureerd"
                | "termijn2Gefactureerd"
                | "termijn3Gefactureerd"
                | "termijn4Gefactureerd";

        const nextDate = value || null;
        const nextChecked = Boolean(nextDate);
        const previousDate = project[dateKey];
        const previousChecked = project[key];

        setProject({
            ...project,
            [dateKey]: nextDate,
            [key]: nextChecked,
        });
        setSaving(true);

        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    [dateKey]: nextDate,
                    [key]: nextChecked,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setProject({
                    ...project,
                    [dateKey]: previousDate,
                    [key]: previousChecked,
                });
                alert(data.error || "Opslaan mislukt");
                return;
            }

            setProject(data);
        } catch (error) {
            console.error(error);
            setProject({
                ...project,
                [dateKey]: previousDate,
                [key]: previousChecked,
            });
            alert("Opslaan mislukt");
        } finally {
            setSaving(false);
        }
    }

    function termijnDatumIso(
        value: string | null | undefined
    ): string {
        if (!value) {
            return "";
        }

        const d = new Date(value);

        if (Number.isNaN(d.getTime())) {
            return "";
        }

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        return `${y}-${m}-${day}`;
    }

    async function boekUren() {
        if (!urenAantal) {
            alert("Vul het aantal uren in");
            return;
        }

        if (geselecteerdeMonteurs.length === 0) {
            alert("Selecteer minimaal één monteur");
            return;
        }

        const response = await fetch(`/api/projects/${id}/uren`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                datum: urenDatum,
                uren: urenAantal,
                omschrijving: urenOmschrijving,
                userIds: geselecteerdeMonteurs,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Uren boeken mislukt");
            return;
        }

        setProject(data);
        setUrenAantal("");
        setUrenOmschrijving("");
        if (role === "engineer" && session?.user?.id) {
            setGeselecteerdeMonteurs([session.user.id]);
        } else if (isOffice) {
            setGeselecteerdeMonteurs([]);
        }
    }

    async function verwijderUren(urenId: string) {
        if (!confirm("Deze urenregel verwijderen?")) {
            return;
        }

        const response = await fetch(
            `/api/projects/${id}/uren?urenId=${urenId}`,
            { method: "DELETE" }
        );

        const data = await response.json();

        if (response.ok) {
            setProject(data);
        }
    }

    async function voegMateriaalToe() {
        const response = await fetch(`/api/projects/${id}/materialen`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                omschrijving: matOmschrijving,
                factuurnummer: matFactuurnummer,
                leverancier: matLeverancier,
                kosten: matKosten,
                ingekochtOp: matDatum || null,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Materiaal toevoegen mislukt");
            return;
        }

        setProject(data);
        setMatOmschrijving("");
        setMatFactuurnummer("");
        setMatLeverancier("");
        setMatKosten("");
        setMatDatum("");
    }

    async function verwijderMateriaal(materiaalId: string) {
        if (!confirm("Dit materiaal verwijderen?")) {
            return;
        }

        const response = await fetch(
            `/api/projects/${id}/materialen?materiaalId=${materiaalId}`,
            { method: "DELETE" }
        );

        const data = await response.json();

        if (response.ok) {
            setProject(data);
        }
    }

    if (loading) {
        return <p>Project laden…</p>;
    }

    if (!project) {
        return <p>Project niet gevonden.</p>;
    }

    return (
        <div className="space-y-6 -m-2">
            <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                    <Link
                        href="/projects"
                        className="text-sm text-[#d6007e] font-medium"
                    >
                        ← Alle projecten
                    </Link>
                    <h1 className="text-2xl font-bold mt-2">
                        {project.name}
                        {project.location || project.plaats ? (
                            <span className="text-gray-600 font-normal">
                                {" "}
                                ·{" "}
                                {[project.location, project.plaats]
                                    .filter(Boolean)
                                    .join(", ")}
                            </span>
                        ) : null}
                    </h1>
                    <p className="text-gray-500">
                        {project.number} · {project.customer.name}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 lg:justify-end w-full lg:w-auto">
                    {isOffice ? (
                        <>
                    <a
                        href={`/api/projects/${id}/export`}
                        className="border rounded-xl px-4 py-3 min-h-[48px] text-sm font-bold hover:bg-gray-50 flex items-center justify-center text-center"
                    >
                        Export Excel
                    </a>
                            {!editingBasics ? (
                                <button
                                    type="button"
                                    onClick={startEditingBasics}
                                    className="border border-[#d6007e] text-[#d6007e] rounded-xl px-4 py-3 min-h-[48px] text-sm font-bold hover:bg-[#fce7f3]/60 flex items-center justify-center"
                                >
                                    Wijzigen
                                </button>
                            ) : null}
                            <DeleteButton
                                toolbar
                                url={`/api/projects/${id}`}
                                label={`project ${project.name}`}
                                onDeleted={() => {
                                    window.location.href = "/projects";
                                }}
                            />
                        </>
                    ) : null}
                </div>
            </header>

            {!editingBasics ? (
                <section className="bg-white border rounded-2xl p-6">
                    <h2 className="font-bold text-lg mb-4">Projectgegevens</h2>
                    <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                    <div>
                        <dt className="font-semibold text-gray-900">
                            Projectnaam
                        </dt>
                        <dd className="mt-1 text-gray-700">{project.name}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold text-gray-900">
                            Adres
                        </dt>
                        <dd className="mt-1 text-gray-700">
                            {project.location || "—"}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-semibold text-gray-900">
                            Plaats
                        </dt>
                        <dd className="mt-1 text-gray-700">
                            {project.plaats || "—"}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-semibold text-gray-900">
                            Opdrachtgever
                        </dt>
                        <dd className="mt-1 text-gray-700">
                            {project.customer.name}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-semibold text-gray-900">
                            Status
                        </dt>
                        <dd className="mt-1 text-gray-700">
                            {project.status === "afgerond"
                                ? "Afgerond"
                                : "Actief"}
                        </dd>
                    </div>
                    {isOffice ? (
                        <>
                    <div>
                        <dt className="font-semibold text-gray-900">
                            Geoffreerde uren
                        </dt>
                        <dd className="mt-1 text-gray-700">
                            {project.geoffreerdeUren > 0
                                ? `${project.geoffreerdeUren} uur`
                                : "—"}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-semibold text-gray-900">
                            Geoffreerd bedrag
                        </dt>
                        <dd className="mt-1 text-gray-700">
                            {project.geoffreerdBedrag > 0
                                ? formatEuro(project.geoffreerdBedrag)
                                : "—"}
                        </dd>
                    </div>
                        </>
                    ) : (
                        <div>
                            <dt className="font-semibold text-gray-900">
                                Uren geboekt
                            </dt>
                            <dd className="mt-1 text-gray-700">
                                {project.gebruikteUren.toFixed(1)} uur
                            </dd>
                        </div>
                    )}
                </dl>
            </section>
            ) : null}

            {isOffice && editingBasics ? (
                <section className="bg-white border rounded-2xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h2 className="font-bold text-lg">Gegevens wijzigen</h2>
                        <button
                            type="button"
                            onClick={cancelEditingBasics}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                            Annuleren
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        Pas naam, locatie, opdrachtgever of budget aan en klik
                        opslaan.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="project-naam"
                                className="block text-sm font-semibold text-gray-900 mb-1.5"
                            >
                                Projectnaam
                            </label>
                            <input
                                id="project-naam"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="border rounded-xl p-3 w-full"
                                placeholder="Bijv. Rosa Spier"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="project-adres"
                                className="block text-sm font-semibold text-gray-900 mb-1.5"
                            >
                                Adres
                            </label>
                            <input
                                id="project-adres"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="border rounded-xl p-3 w-full"
                                placeholder="Bijv. Brink 12"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="project-plaats"
                                className="block text-sm font-semibold text-gray-900 mb-1.5"
                            >
                                Plaats
                            </label>
                            <input
                                id="project-plaats"
                                value={plaats}
                                onChange={(e) => setPlaats(e.target.value)}
                                className="border rounded-xl p-3 w-full"
                                placeholder="Bijv. Laren"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="project-opdrachtgever"
                                className="block text-sm font-semibold text-gray-900 mb-1.5"
                            >
                                Opdrachtgever
                            </label>
                            <select
                                id="project-opdrachtgever"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="border rounded-xl p-3 w-full"
                            >
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="project-status"
                                className="block text-sm font-semibold text-gray-900 mb-1.5"
                            >
                                Status
                            </label>
                            <select
                                id="project-status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="border rounded-xl p-3 w-full"
                            >
                                <option value="actief">Actief</option>
                                <option value="afgerond">Afgerond</option>
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="project-uren"
                                className="block text-sm font-semibold text-gray-900 mb-1.5"
                            >
                                Geoffreerde uren
                            </label>
                            <input
                                id="project-uren"
                                type="number"
                                min={0}
                                step={0.5}
                                value={geoffreerdeUren}
                                onChange={(e) =>
                                    setGeoffreerdeUren(e.target.value)
                                }
                                className="border rounded-xl p-3 w-full"
                                placeholder="Bijv. 320"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="project-bedrag"
                                className="block text-sm font-semibold text-gray-900 mb-1.5"
                            >
                                Geoffreerd bedrag (€)
                            </label>
                            <input
                                id="project-bedrag"
                                type="number"
                                min={0}
                                step={0.01}
                                value={geoffreerdBedrag}
                                onChange={(e) =>
                                    setGeoffreerdBedrag(e.target.value)
                                }
                                className="border rounded-xl p-3 w-full"
                                placeholder="Bijv. 20000"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={saveBasics}
                        disabled={saving}
                        className="bg-[#d6007e] text-white rounded-xl px-6 py-3 font-bold disabled:opacity-60"
                    >
                        {saving ? "Opslaan…" : "Gegevens opslaan"}
                    </button>
                </section>
            ) : null}

            {isOffice ? (
            <>
            <section className="bg-white border rounded-2xl p-5 space-y-3">
                <h2 className="font-bold">Termijnen gefactureerd</h2>
                <p className="text-xs text-gray-500">
                    Vul de factuurdatum in: het vinkje gaat dan
                    automatisch aan. Wis de datum om uit te vinken.
                </p>
                <div className="grid grid-cols-4 gap-2 min-w-0 overflow-x-auto">
                    {(
                        [
                            {
                                key: "termijn1Gefactureerd",
                                dateKey: "termijn1GefactureerdOp",
                                label: "Termijn 1 — akkoord opdracht (inkoop)",
                            },
                            {
                                key: "termijn2Gefactureerd",
                                dateKey: "termijn2GefactureerdOp",
                                label: "Termijn 2 — start opdracht",
                            },
                            {
                                key: "termijn3Gefactureerd",
                                dateKey: "termijn3GefactureerdOp",
                                label: "Termijn 3 — 50%",
                            },
                            {
                                key: "termijn4Gefactureerd",
                                dateKey: "termijn4GefactureerdOp",
                                label: "Termijn 4 — 100%",
                            },
                        ] as const
                    ).map((termijn) => {
                        const factuurdatum = termijnDatumIso(
                            project[termijn.dateKey]
                        );
                        // Alleen aangevinkt wanneer er een factuurdatum is.
                        const isChecked = Boolean(factuurdatum);

                        return (
                        <div
                            key={termijn.key}
                            className="
                                rounded-xl border border-gray-200
                                px-3 py-2 space-y-2 min-w-0
                            "
                        >
                            <label className="flex items-start gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={saving}
                                    onChange={(e) =>
                                        toggleTermijnGefactureerd(
                                            termijn.key,
                                            e.target.checked
                                        )
                                    }
                                    className="mt-0.5 h-4 w-4 accent-[#0066FF] shrink-0"
                                />
                                <span className="font-medium text-gray-800 leading-snug">
                                    {termijn.label}
                                </span>
                            </label>
                            <div className="pl-6">
                                <label className="block text-xs text-gray-500 mb-1">
                                    Factuurdatum
                                </label>
                                <input
                                    type="date"
                                    value={factuurdatum}
                                    disabled={saving}
                                    onChange={(e) =>
                                        setTermijnGefactureerdDatum(
                                            termijn.dateKey,
                                            e.target.value
                                        )
                                    }
                                    className="border rounded-lg px-2 py-1.5 text-sm w-full max-w-full bg-white"
                                />
                            </div>
                        </div>
                        );
                    })}
                </div>
            </section>

            <section className="grid lg:grid-cols-2 gap-4">
                <div className="bg-white border rounded-2xl p-5 space-y-4">
                    <h2 className="font-bold">Uren</h2>
                    <ProgressBar
                        label="Gebruikt vs. geoffreerd"
                        gebruikt={project.gebruikteUren}
                        geoffreerd={
                            project.geoffreerdeUren > 0
                                ? project.geoffreerdeUren
                                : null
                        }
                    />
                    <BudgetBadge
                        gebruikt={project.gebruikteUren}
                        geoffreerd={
                            project.geoffreerdeUren > 0
                                ? project.geoffreerdeUren
                                : null
                        }
                        eenheid="uur"
                    />
                </div>

                <div className="bg-white border rounded-2xl p-5 space-y-4">
                    <h2 className="font-bold">Materiaal & budget</h2>
                    <p className="text-sm text-gray-600">
                        Ingekocht materiaal:{" "}
                        <strong>
                            {formatEuro(project.materiaalKosten)}
                        </strong>
                    </p>
                    {project.geoffreerdBedrag > 0 ? (
                        <>
                            <ProgressBar
                                label="Materiaalkosten vs. geoffreerd bedrag"
                                gebruikt={project.materiaalKosten}
                                geoffreerd={project.geoffreerdBedrag}
                            />
                            <BudgetBadge
                                gebruikt={project.materiaalKosten}
                                geoffreerd={project.geoffreerdBedrag}
                                eenheid="€"
                            />
                        </>
                    ) : (
                        <p className="text-xs text-gray-500">
                            Vul een geoffreerd bedrag in om groen/rood op
                            materiaal te zien.
                        </p>
                    )}
                </div>
            </section>
            </>
            ) : (
                <section className="bg-white border rounded-2xl p-5">
                    <h2 className="font-bold mb-2">Uren geboekt</h2>
                    <p className="text-3xl font-bold text-[#d6007e]">
                        {project.gebruikteUren.toFixed(1)}
                        <span className="text-base font-medium text-gray-500 ml-2">
                            uur totaal
                        </span>
                    </p>
                </section>
            )}

            {isOffice ? (
            <section className="bg-white border rounded-2xl p-6 space-y-4">
                <h2 className="font-bold text-lg">Offerte (PDF)</h2>
                {project.offerteUrl ? (
                    <a
                        href={project.offerteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#d6007e] font-medium underline"
                    >
                        {project.offerteFilename || "Offerte bekijken"}
                    </a>
                ) : (
                    <p className="text-sm text-gray-500">
                        Nog geen offerte geüpload.
                    </p>
                )}
                {isOffice ? (
                    <label className="inline-block">
                        <span className="bg-gray-100 rounded-xl px-4 py-2 text-sm font-medium cursor-pointer hover:bg-gray-200">
                            {offerteUploading
                                ? "Uploaden…"
                                : "PDF uploaden"}
                        </span>
                        <input
                            type="file"
                            accept="application/pdf,.pdf"
                            className="hidden"
                            disabled={offerteUploading}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    uploadOfferte(file);
                                }
                            }}
                        />
                    </label>
                ) : null}
            </section>
            ) : null}

            <section className="bg-white border rounded-2xl p-6 space-y-4">
                <h2 className="font-bold text-lg">Urenlog</h2>

                {urenPerMonteur.length > 0 ? (
                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700">
                            Overzicht per monteur
                        </h3>
                        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {urenPerMonteur.map((row) => (
                                <li
                                    key={row.naam}
                                    className="bg-white border rounded-lg px-3 py-2 text-sm flex justify-between gap-2"
                                >
                                    <span className="font-medium">
                                        {row.naam}
                                    </span>
                                    <span className="text-gray-600">
                                        {row.totaal.toFixed(1)} uur
                                        {row.km > 0 ? (
                                            <span className="text-gray-500">
                                                {" "}
                                                · {row.km.toFixed(1)} km
                                            </span>
                                        ) : null}
                                        <span className="text-gray-400 text-xs ml-1">
                                            ({row.regels}×)
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                {(isOffice || role === "engineer") &&
                (project.status === "actief" ||
                    project.status === "new") ? (
                    <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600 block mb-1">
                                    Datum
                                </label>
                                <input
                                    type="date"
                                    value={urenDatum}
                                    onChange={(e) =>
                                        setUrenDatum(e.target.value)
                                    }
                                    className="border rounded-xl p-3 min-h-[48px] w-full bg-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 block mb-1">
                                    Aantal uren
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={urenAantal}
                                    onChange={(e) =>
                                        setUrenAantal(e.target.value)
                                    }
                                    placeholder="Bijv. 8 of 1.30"
                                    className="border rounded-xl p-3 min-h-[48px] w-full bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <label className="text-xs font-medium text-gray-600">
                                    Monteurs (meerdere mogelijk)
                                </label>
                                <button
                                    type="button"
                                    onClick={selecteerAlleMonteurs}
                                    className="text-xs text-[#d6007e] font-medium"
                                >
                                    Alles selecteren
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                                Je mag uren voor collega&apos;s boeken. In het
                                urenoverzicht blijft zichtbaar{" "}
                                <span className="font-medium text-gray-600">
                                    wie de uren heeft ingevoerd
                                </span>
                                .
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {engineers.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        Geen actieve monteurs gevonden.
                                    </p>
                                ) : (
                                    engineers.map((eng) => {
                                        const checked =
                                            geselecteerdeMonteurs.includes(
                                                eng.id
                                            );
                                        const label =
                                            eng.name?.trim() ||
                                            "Monteur";

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
                                                        toggleMonteur(
                                                            eng.id
                                                        )
                                                    }
                                                    className="rounded"
                                                />
                                                {label}
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">
                                Omschrijving (optioneel)
                            </label>
                            <input
                                value={urenOmschrijving}
                                onChange={(e) =>
                                    setUrenOmschrijving(e.target.value)
                                }
                                placeholder="Bijv. installatie schermen hal 2"
                                className="border rounded-xl p-3 min-h-[48px] w-full bg-white"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={boekUren}
                            className="w-full sm:w-auto bg-[#d6007e] text-white rounded-xl py-4 min-h-[48px] px-6 font-bold text-base"
                        >
                            Uren toevoegen
                        </button>
                    </div>
                ) : null}

                {project.uren.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Nog geen uren geboekt.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="py-2 pr-4">Datum</th>
                                    <th className="py-2 pr-4">Monteur</th>
                                    <th className="py-2 pr-4">Uren</th>
                                    <th className="py-2 pr-4">Km</th>
                                    <th className="py-2 pr-4">Geboekt door</th>
                                    <th className="py-2 pr-4">Geboekt op</th>
                                    <th className="py-2 pr-4">Omschrijving</th>
                                    {isOffice ? (
                                        <th className="py-2" />
                                    ) : null}
                                </tr>
                            </thead>
                            <tbody>
                                {project.uren.map((row) => {
                                    const geboektDoor = row.bookedBy
                                        ? monteurLabel(row.bookedBy)
                                        : monteurLabel(row.user);

                                    return (
                                    <tr key={row.id} className="border-b">
                                        <td className="py-2 pr-4">
                                            {formatDate(row.datum)}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {monteurLabel(row.user)}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {formatHoursDisplay(row.uren) ||
                                                row.uren}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {row.kilometers != null
                                                ? row.kilometers
                                                : "—"}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {geboektDoor}
                                        </td>
                                        <td className="py-2 pr-4 whitespace-nowrap">
                                            {row.createdAt
                                                ? formatDateTime(
                                                      row.createdAt
                                                  )
                                                : "—"}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {row.omschrijving || "—"}
                                        </td>
                                        {isOffice ? (
                                            <td className="py-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        verwijderUren(row.id)
                                                    }
                                                    className="text-red-600 text-xs"
                                                >
                                                    Verwijder
                                                </button>
                                            </td>
                                        ) : null}
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

{isOffice ? (
            <section className="bg-white border rounded-2xl p-6 space-y-4">
                <h2 className="font-bold text-lg">
                    In te kopen / ingekocht materiaal
                </h2>

                <div className="grid sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
                        <input
                            value={matOmschrijving}
                            onChange={(e) =>
                                setMatOmschrijving(e.target.value)
                            }
                            placeholder="Omschrijving"
                            className="border rounded-xl p-3 min-h-[48px] sm:col-span-2"
                        />
                        <input
                            value={matFactuurnummer}
                            onChange={(e) =>
                                setMatFactuurnummer(e.target.value)
                            }
                            placeholder="Factuurnummer (optioneel)"
                            className="border rounded-xl p-3 min-h-[48px]"
                        />
                        <input
                            value={matLeverancier}
                            onChange={(e) =>
                                setMatLeverancier(e.target.value)
                            }
                            placeholder="Leverancier (optioneel)"
                            className="border rounded-xl p-3 min-h-[48px]"
                        />
                        <input
                            type="number"
                            step={0.01}
                            min={0}
                            value={matKosten}
                            onChange={(e) => setMatKosten(e.target.value)}
                            placeholder="Kosten €"
                            className="border rounded-xl p-3 min-h-[48px]"
                        />
                        <input
                            type="date"
                            value={matDatum}
                            onChange={(e) => setMatDatum(e.target.value)}
                            className="border rounded-xl p-3 min-h-[48px]"
                            title="Datum ingekocht (optioneel)"
                        />
                        <button
                            type="button"
                            onClick={voegMateriaalToe}
                            className="bg-[#d6007e] text-white rounded-xl py-2 font-bold"
                        >
                            Materiaal toevoegen
                        </button>
                    </div>

                {project.materialen.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Nog geen materialen geregistreerd.
                    </p>
                ) : (
                    <ul className="divide-y">
                        {project.materialen.map((m) => (
                            <li
                                key={m.id}
                                className="py-3 flex justify-between gap-4 items-start"
                            >
                                <div>
                                    <div className="font-medium">
                                        {m.omschrijving}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {m.factuurnummer
                                            ? `Factuur: ${m.factuurnummer} · `
                                            : ""}
                                        {m.leverancier
                                            ? `${m.leverancier} · `
                                            : ""}
                                        {m.ingekochtOp
                                            ? formatDate(m.ingekochtOp)
                                            : "Nog niet ingekocht"}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold">
                                        {formatEuro(m.kosten)}
                                    </span>
                                    {isOffice ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                verwijderMateriaal(m.id)
                                            }
                                            className="text-red-600 text-xs"
                                        >
                                            Verwijder
                                        </button>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
            ) : null}

            {project.workorders.length > 0 ? (
                <section className="bg-white border rounded-2xl p-6 space-y-3">
                    <h2 className="font-bold text-lg">Gekoppelde werkbonnen</h2>
                    <ul className="divide-y">
                        {project.workorders.map((w) => (
                            <li key={w.id} className="py-2">
                                <Link
                                    href={`/workorders/${w.id}`}
                                    className="text-[#d6007e] font-medium"
                                >
                                    {w.number} — {w.title}
                                </Link>
                                <span className="text-xs text-gray-500 ml-2">
                                    {w.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            {isOffice && projectIsActive ? (
                <section className="bg-white border rounded-2xl p-6">
                    <button
                        type="button"
                        onClick={markeerProjectAfgerond}
                        disabled={completing}
                        className="w-full bg-gray-900 text-white rounded-xl py-4 min-h-[52px] font-bold text-base disabled:opacity-60"
                    >
                        {completing
                            ? "Bezig…"
                            : "Project afgerond"}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-3">
                        Het project verplaatst naar de map Afgeronde projecten.
                        Uren en gegevens blijven bewaard.
                    </p>
                </section>
            ) : null}
        </div>
    );
}
