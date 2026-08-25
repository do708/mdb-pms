"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

import DeleteButton from "@/components/DeleteButton";
import {
    BudgetBadge,
    ProgressBar,
    ProjectResultaatTotaal,
} from "@/components/projects/ProjectBudget";
import ProjectPlattegronden from "@/components/projects/ProjectPlattegronden";
import ProjectIntakeGegevens from "@/components/projects/ProjectIntakeGegevens";
import ProjectUrenAfdruk from "@/components/projects/ProjectUrenAfdruk";
import BunniKoppeling, {
    BunniDocumentPicker,
} from "@/components/bunni/BunniKoppeling";
import {
    PageHeader,
    PageShell,
    SpecFieldLabel,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
    specInputClassName,
    specSelectClassName,
} from "@/components/ui/SpecLayout";
import { formatHoursDisplay } from "@/lib/hours";
import { filterEngineersForDay } from "@/constants/staffKind";
import {
    inferTermijnAantal,
    projectTermijnen,
    termijnBedrag,
    type ProjectTermijn,
    type TermijnAantal,
} from "@/lib/projects/budget";

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
    bunniOfferteId: string | null;
    bunniOfferteNummer: string | null;
    bunniOffertePdfUrl: string | null;
    bunniFactuurId: string | null;
    bunniFactuurNummer: string | null;
    bunniFactuurPdfUrl: string | null;
    termijnAantal: number | null;
    termijn1Gefactureerd: boolean;
    termijn2Gefactureerd: boolean;
    termijn3Gefactureerd: boolean;
    termijn4Gefactureerd: boolean;
    termijn1GefactureerdOp: string | null;
    termijn2GefactureerdOp: string | null;
    termijn3GefactureerdOp: string | null;
    termijn4GefactureerdOp: string | null;
    termijn1Factuurnummer: string | null;
    termijn2Factuurnummer: string | null;
    termijn3Factuurnummer: string | null;
    termijn4Factuurnummer: string | null;
    intakeTekst: string | null;
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
    bijlagen: {
        id: string;
        url: string;
        filename: string | null;
        originalName: string | null;
        contentType: string | null;
        createdAt: string;
    }[];
    intakeBijlagen: {
        id: string;
        url: string;
        filename: string | null;
        originalName: string | null;
        contentType: string | null;
        createdAt: string;
    }[];
}

interface Customer {
    id: string;
    name: string;
}

interface EngineerOption {
    id: string;
    name: string | null;
    staffKind?: string | null;
    stagiaireUntil?: string | Date | null;
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

    const [editingBasics, setEditingBasics] = useState(false);
    const [completing, setCompleting] = useState(false);

    const projectIsActive =
        project?.status === "actief" || project?.status === "new";

    const termijnAantal = useMemo(
        () => (project ? inferTermijnAantal(project) : null),
        [project]
    );
    const zichtbareTermijnen = termijnAantal
        ? projectTermijnen(termijnAantal)
        : [];

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
        if (!editingBasics) {
            resetFormFromProject(data);
        }
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

    const boekbareMonteurs = useMemo(
        () => filterEngineersForDay(engineers, urenDatum),
        [engineers, urenDatum]
    );

    useEffect(() => {
        const allowed = new Set(boekbareMonteurs.map((e) => e.id));

        setGeselecteerdeMonteurs((prev) => {
            const next = prev.filter((id) => allowed.has(id));

            if (next.length > 0) {
                return next.length === prev.length ? prev : next;
            }

            if (
                role === "engineer"
                && session?.user?.id
                && allowed.has(session.user.id)
            ) {
                return [session.user.id];
            }

            return next;
        });
    }, [boekbareMonteurs, role, session?.user?.id]);

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
        setGeselecteerdeMonteurs(boekbareMonteurs.map((e) => e.id));
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

    async function koppelTermijnBunniFactuur(
        termijn: ProjectTermijn,
        hit: {
            number: string;
            date: string | null;
        } | null
    ) {
        if (!project) {
            return;
        }

        const nextNumber = hit?.number?.trim() || null;
        const previousNumber = project[termijn.numKey];
        const previousDate = project[termijn.dateKey];
        const nextDate =
            hit?.date && /^\d{4}-\d{2}-\d{2}/.test(hit.date)
                ? hit.date.slice(0, 10)
                : previousDate;

        if (nextNumber === previousNumber && !hit) {
            return;
        }

        setProject({
            ...project,
            [termijn.numKey]: nextNumber,
            ...(hit?.date
                ? {
                      [termijn.dateKey]: nextDate,
                      [termijn.key]: true,
                  }
                : {}),
        });
        setSaving(true);

        try {
            const body: Record<string, unknown> = {
                [termijn.numKey]: nextNumber,
            };
            if (hit?.date) {
                body[termijn.dateKey] = nextDate;
            }

            const response = await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                setProject({
                    ...project,
                    [termijn.numKey]: previousNumber,
                    [termijn.dateKey]: previousDate,
                });
                alert(data.error || "Opslaan mislukt");
                return;
            }

            setProject(data);
        } catch (error) {
            console.error(error);
            setProject({
                ...project,
                [termijn.numKey]: previousNumber,
                [termijn.dateKey]: previousDate,
            });
            alert("Opslaan mislukt");
        } finally {
            setSaving(false);
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

    async function kiesTermijnAantal(aantal: TermijnAantal) {
        if (!project || project.termijnAantal === aantal) {
            return;
        }

        const previous = project.termijnAantal;

        setProject({
            ...project,
            termijnAantal: aantal,
        });
        setSaving(true);

        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ termijnAantal: aantal }),
            });

            const data = await response.json();

            if (!response.ok) {
                setProject({
                    ...project,
                    termijnAantal: previous,
                });
                alert(data.error || "Opslaan mislukt");
                return;
            }

            setProject(data);
        } catch (error) {
            console.error(error);
            setProject({
                ...project,
                termijnAantal: previous,
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
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Project laden…</p>
            </PageShell>
        );
    }

    if (!project) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Project niet gevonden.</p>
            </PageShell>
        );
    }

    const huidigProject = project;

    function printUrenoverzicht() {
        const vorigeTitel = document.title;
        document.title = `Urenoverzicht ${huidigProject.number} ${huidigProject.name}`;
        const herstel = () => {
            document.title = vorigeTitel;
            window.removeEventListener("afterprint", herstel);
        };
        window.addEventListener("afterprint", herstel);
        window.print();
    }

    return (
        <PageShell className="print:p-0 print:space-y-0">
            <div className="print:hidden space-y-6">
            <Link
                href="/projects"
                className="text-sm text-[#d6007e] font-medium -mt-2"
            >
                ← Alle projecten
            </Link>

            <PageHeader
                title={
                    <>
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
                    </>
                }
                subtitle={`${project.number} · ${project.customer.name}`}
                actions={
                    isOffice ? (
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
                    ) : null
                }
            />

            {!editingBasics ? (
                <SpecPageCard>
                    <SpecPanel title="Projectgegevens">
                        <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                            <div>
                                <dt>
                                    <SpecFieldLabel>Projectnaam</SpecFieldLabel>
                                </dt>
                                <dd className="mt-0.5 text-gray-800 font-medium">
                                    {project.name}
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    <SpecFieldLabel>Adres</SpecFieldLabel>
                                </dt>
                                <dd className="mt-0.5 text-gray-800">
                                    {project.location || "—"}
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    <SpecFieldLabel>Plaats</SpecFieldLabel>
                                </dt>
                                <dd className="mt-0.5 text-gray-800">
                                    {project.plaats || "—"}
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    <SpecFieldLabel>Opdrachtgever</SpecFieldLabel>
                                </dt>
                                <dd className="mt-0.5 text-gray-800">
                                    {project.customer.name}
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    <SpecFieldLabel>Status</SpecFieldLabel>
                                </dt>
                                <dd className="mt-0.5 text-gray-800">
                                    {project.status === "afgerond"
                                        ? "Afgerond"
                                        : "Actief"}
                                </dd>
                            </div>
                            {isOffice ? (
                                <>
                                    <div>
                                        <dt>
                                            <SpecFieldLabel>
                                                Geoffreerde uren
                                            </SpecFieldLabel>
                                        </dt>
                                        <dd className="mt-0.5 text-gray-800">
                                            {project.geoffreerdeUren > 0
                                                ? `${project.geoffreerdeUren} uur`
                                                : "—"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>
                                            <SpecFieldLabel>
                                                Geoffreerd bedrag
                                            </SpecFieldLabel>
                                        </dt>
                                        <dd className="mt-0.5 text-gray-800">
                                            {project.geoffreerdBedrag > 0
                                                ? formatEuro(
                                                      project.geoffreerdBedrag
                                                  )
                                                : "—"}
                                        </dd>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <dt>
                                        <SpecFieldLabel>
                                            Uren geboekt
                                        </SpecFieldLabel>
                                    </dt>
                                    <dd className="mt-0.5 text-gray-800">
                                        {project.gebruikteUren.toFixed(1)} uur
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </SpecPanel>
                </SpecPageCard>
            ) : null}

            {isOffice && editingBasics ? (
                <SpecPageCard>
                    <SpecPanel
                        title="Gegevens wijzigen"
                        hint="Pas naam, locatie, opdrachtgever of budget aan en klik opslaan."
                        actions={
                            <button
                                type="button"
                                onClick={cancelEditingBasics}
                                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                Annuleren
                            </button>
                        }
                    >
                        <div className="grid md:grid-cols-2 gap-4">
                            <label className="block">
                                <SpecFieldLabel>Projectnaam</SpecFieldLabel>
                                <input
                                    id="project-naam"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={specInputClassName}
                                    placeholder="Bijv. Rosa Spier"
                                />
                            </label>
                            <label className="block">
                                <SpecFieldLabel>Adres</SpecFieldLabel>
                                <input
                                    id="project-adres"
                                    value={location}
                                    onChange={(e) =>
                                        setLocation(e.target.value)
                                    }
                                    className={specInputClassName}
                                    placeholder="Bijv. Brink 12"
                                />
                            </label>
                            <label className="block">
                                <SpecFieldLabel>Plaats</SpecFieldLabel>
                                <input
                                    id="project-plaats"
                                    value={plaats}
                                    onChange={(e) => setPlaats(e.target.value)}
                                    className={specInputClassName}
                                    placeholder="Bijv. Laren"
                                />
                            </label>
                            <label className="block">
                                <SpecFieldLabel>Opdrachtgever</SpecFieldLabel>
                                <select
                                    id="project-opdrachtgever"
                                    value={customerId}
                                    onChange={(e) =>
                                        setCustomerId(e.target.value)
                                    }
                                    className={specSelectClassName}
                                >
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <SpecFieldLabel>Status</SpecFieldLabel>
                                <select
                                    id="project-status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className={specSelectClassName}
                                >
                                    <option value="actief">Actief</option>
                                    <option value="afgerond">Afgerond</option>
                                </select>
                            </label>
                            <label className="block">
                                <SpecFieldLabel>Geoffreerde uren</SpecFieldLabel>
                                <input
                                    id="project-uren"
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={geoffreerdeUren}
                                    onChange={(e) =>
                                        setGeoffreerdeUren(e.target.value)
                                    }
                                    className={specInputClassName}
                                    placeholder="Bijv. 320"
                                />
                            </label>
                            <label className="block">
                                <SpecFieldLabel>
                                    Geoffreerd bedrag (€)
                                </SpecFieldLabel>
                                <input
                                    id="project-bedrag"
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={geoffreerdBedrag}
                                    onChange={(e) =>
                                        setGeoffreerdBedrag(e.target.value)
                                    }
                                    className={specInputClassName}
                                    placeholder="Bijv. 20000"
                                />
                            </label>
                        </div>
                        <button
                            type="button"
                            onClick={saveBasics}
                            disabled={saving}
                            className="bg-[#d6007e] text-white rounded-xl px-6 py-3 font-bold disabled:opacity-60"
                        >
                            {saving ? "Opslaan…" : "Gegevens opslaan"}
                        </button>
                    </SpecPanel>
                </SpecPageCard>
            ) : null}

            <ProjectIntakeGegevens
                projectId={project.id}
                tekst={project.intakeTekst}
                items={project.intakeBijlagen ?? []}
                canEdit={isOffice}
                onChanged={loadProject}
            />

            {isOffice ? (
                <>
                    <div className="grid lg:grid-cols-2 gap-4">
                        <SpecPageCard>
                            <SpecPanel title="Uren / budget">
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
                            </SpecPanel>
                        </SpecPageCard>

                        <SpecPageCard>
                            <SpecPanel title="Materiaal & budget">
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
                                            geoffreerd={
                                                project.geoffreerdBedrag
                                            }
                                        />
                                        <BudgetBadge
                                            gebruikt={
                                                project.materiaalKosten
                                            }
                                            geoffreerd={
                                                project.geoffreerdBedrag
                                            }
                                            eenheid="€"
                                        />
                                    </>
                                ) : (
                                    <p className="text-xs text-gray-500">
                                        Vul een geoffreerd bedrag in om
                                        groen/rood op materiaal te zien.
                                    </p>
                                )}
                            </SpecPanel>
                        </SpecPageCard>
                    </div>

                    <SpecPageCard>
                        <SpecPanel title="Totaal">
                            <ProjectResultaatTotaal
                                uren={project.gebruikteUren}
                                materiaal={project.materiaalKosten}
                                offerte={project.geoffreerdBedrag}
                            />
                        </SpecPanel>
                    </SpecPageCard>

                    <SpecPageCard>
                        <SpecPanel
                            title="Termijnen gefactureerd"
                            hint="Kies 1 factuur of 4 termijnen. Factuurnummer kies je uit Bunni; de factuurdatum vult mee als die in Bunni bekend is."
                        >
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-800 mb-2">
                                        Hoeveel termijnen factureer je?
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {([1, 4] as const).map((aantal) => {
                                            const selected =
                                                termijnAantal === aantal;

                                            return (
                                                <button
                                                    key={aantal}
                                                    type="button"
                                                    disabled={saving}
                                                    onClick={() =>
                                                        kiesTermijnAantal(
                                                            aantal
                                                        )
                                                    }
                                                    className={`
                                                        rounded-xl px-4 py-2.5 min-h-[44px]
                                                        text-sm font-bold border
                                                        ${
                                                            selected
                                                                ? "bg-[#0066FF] text-white border-[#0066FF]"
                                                                : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                                                        }
                                                    `}
                                                >
                                                    {aantal === 1
                                                        ? "1 termijn"
                                                        : "4 termijnen"}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {zichtbareTermijnen.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        Kies 1 of 4 termijnen om de
                                        factuurvakken te zien.
                                    </p>
                                ) : (
                                    <div
                                        className={
                                            termijnAantal === 1
                                                ? "grid grid-cols-1 max-w-md gap-2 min-w-0"
                                                : "grid grid-cols-4 grid-rows-[auto_auto_auto] gap-2 min-w-0 overflow-x-auto"
                                        }
                                    >
                    {zichtbareTermijnen.map((termijn) => {
                        const factuurdatum = termijnDatumIso(
                            project[termijn.dateKey]
                        );
                        const isChecked = Boolean(factuurdatum);
                        const bedrag = termijnBedrag(
                            project.geoffreerdBedrag,
                            termijn.percentage
                        );

                        return (
                        <div
                            key={termijn.key}
                            className={
                                termijnAantal === 1
                                    ? "flex flex-col gap-y-2 rounded-xl border border-gray-200 px-3 py-2 min-w-0"
                                    : `
                                        grid grid-rows-subgrid row-span-3 gap-y-2
                                        rounded-xl border border-gray-200
                                        px-3 py-2 min-w-0
                                    `
                            }
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
                                <span className="min-w-0">
                                    <span className="block font-medium text-gray-800 leading-snug">
                                        {termijn.label}
                                    </span>
                                    <span className="block text-xs text-gray-500 mt-0.5">
                                        {termijn.percentage}%
                                        {bedrag > 0
                                            ? ` · ${formatEuro(bedrag)}`
                                            : ""}
                                    </span>
                                </span>
                            </label>
                            <div className="pl-6">
                                <label className="block mb-1">
                                    <SpecFieldLabel>
                                        Factuurdatum
                                    </SpecFieldLabel>
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
                            <div className="pl-6 min-w-0">
                                <label className="block mb-1">
                                    <SpecFieldLabel>
                                        Factuurnummer
                                    </SpecFieldLabel>
                                </label>
                                <BunniDocumentPicker
                                    kind="factuur"
                                    compact
                                    disabled={saving}
                                    value={{
                                        id: null,
                                        number:
                                            project[termijn.numKey] || null,
                                        pdfUrl: null,
                                    }}
                                    onSelect={(hit) =>
                                        koppelTermijnBunniFactuur(termijn, hit)
                                    }
                                    onClear={() =>
                                        koppelTermijnBunniFactuur(termijn, null)
                                    }
                                />
                            </div>
                        </div>
                        );
                    })}
                                    </div>
                                )}
                            </div>
                        </SpecPanel>
                    </SpecPageCard>

                    <SpecPageCard>
                        <SpecPanel
                            title="Offerte"
                            hint="Plak de Bunni-paginalink (…/offerte-334165) en het offertenummer op de offerte (bijv. 260466). Pagina opent die offerte in Bunni; pdf blijft apart beschikbaar."
                        >
                            <BunniKoppeling
                                saveUrl={`/api/projects/${project.id}/bunni`}
                                showFactuur={false}
                                offerte={{
                                    id: project.bunniOfferteId,
                                    number: project.bunniOfferteNummer,
                                    pdfUrl: project.bunniOffertePdfUrl,
                                }}
                                factuur={{
                                    id: null,
                                    number: null,
                                    pdfUrl: null,
                                }}
                                onUpdated={(data) => {
                                    if (data && typeof data === "object") {
                                        setProject(data as ProjectDetail);
                                    }
                                }}
                            />
                        </SpecPanel>
                    </SpecPageCard>
                </>
            ) : (
                <SpecPageCard>
                    <SpecPanel title="Uren geboekt">
                        <p className="text-3xl font-bold text-[#d6007e]">
                            {project.gebruikteUren.toFixed(1)}
                            <span className="text-base font-medium text-gray-500 ml-2">
                                uur totaal
                            </span>
                        </p>
                    </SpecPanel>
                </SpecPageCard>
            )}

            <ProjectPlattegronden
                projectId={project.id}
                items={project.bijlagen ?? []}
                canEdit={isOffice}
                onChanged={loadProject}
            />

            <SpecPageCard>
                <SpecPanel
                    title="Urenlog"
                    actions={
                        project.uren.length > 0 ? (
                            <button
                                type="button"
                                onClick={printUrenoverzicht}
                                className="inline-flex items-center rounded-lg bg-[#0066FF] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0052cc]"
                            >
                                Afdrukken
                            </button>
                        ) : null
                    }
                >
                {urenPerMonteur.length > 0 ? (
                    <SpecPanel title="Overzicht per monteur" tone="slate">
                        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {urenPerMonteur.map((row) => (
                                <li key={row.naam}>
                                    <SpecListRow className="text-sm flex justify-between gap-2">
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
                                    </SpecListRow>
                                </li>
                            ))}
                        </ul>
                    </SpecPanel>
                ) : null}

                {(isOffice || role === "engineer") &&
                (project.status === "actief" ||
                    project.status === "new") ? (
                    <SpecPanel title="Uren boeken" tone="indigo">
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="block">
                                <SpecFieldLabel>Datum</SpecFieldLabel>
                                <input
                                    type="date"
                                    value={urenDatum}
                                    onChange={(e) =>
                                        setUrenDatum(e.target.value)
                                    }
                                    className={`${specInputClassName} min-h-[48px]`}
                                />
                            </label>
                            <label className="block">
                                <SpecFieldLabel>Aantal uren</SpecFieldLabel>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={urenAantal}
                                    onChange={(e) =>
                                        setUrenAantal(e.target.value)
                                    }
                                    placeholder="Bijv. 8 of 1.30"
                                    className={`${specInputClassName} min-h-[48px]`}
                                />
                            </label>
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <SpecFieldLabel>
                                    Monteurs (meerdere mogelijk)
                                </SpecFieldLabel>
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
                                {boekbareMonteurs.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        Geen actieve monteurs gevonden.
                                    </p>
                                ) : (
                                    boekbareMonteurs.map((eng) => {
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

                        <label className="block">
                            <SpecFieldLabel>
                                Omschrijving (optioneel)
                            </SpecFieldLabel>
                            <input
                                value={urenOmschrijving}
                                onChange={(e) =>
                                    setUrenOmschrijving(e.target.value)
                                }
                                placeholder="Bijv. installatie schermen hal 2"
                                className={`${specInputClassName} min-h-[48px]`}
                            />
                        </label>

                        <button
                            type="button"
                            onClick={boekUren}
                            className="w-full sm:w-auto bg-[#d6007e] text-white rounded-xl py-4 min-h-[48px] px-6 font-bold text-base"
                        >
                            Uren toevoegen
                        </button>
                    </SpecPanel>
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
                </SpecPanel>
            </SpecPageCard>

            {isOffice ? (
                <SpecPageCard>
                    <SpecPanel title="Materiaal lijst">
                        <SpecPanel tone="slate" className="!p-3">
                            <div className="grid sm:grid-cols-2 gap-3">
                                <input
                                    value={matOmschrijving}
                                    onChange={(e) =>
                                        setMatOmschrijving(e.target.value)
                                    }
                                    placeholder="Omschrijving"
                                    className={`${specInputClassName} min-h-[48px] sm:col-span-2`}
                                />
                                <input
                                    value={matFactuurnummer}
                                    onChange={(e) =>
                                        setMatFactuurnummer(e.target.value)
                                    }
                                    placeholder="Factuurnummer (optioneel)"
                                    className={`${specInputClassName} min-h-[48px]`}
                                />
                                <input
                                    value={matLeverancier}
                                    onChange={(e) =>
                                        setMatLeverancier(e.target.value)
                                    }
                                    placeholder="Leverancier (optioneel)"
                                    className={`${specInputClassName} min-h-[48px]`}
                                />
                                <input
                                    type="number"
                                    step={0.01}
                                    min={0}
                                    value={matKosten}
                                    onChange={(e) =>
                                        setMatKosten(e.target.value)
                                    }
                                    placeholder="Kosten €"
                                    className={`${specInputClassName} min-h-[48px]`}
                                />
                                <input
                                    type="date"
                                    value={matDatum}
                                    onChange={(e) =>
                                        setMatDatum(e.target.value)
                                    }
                                    className={`${specInputClassName} min-h-[48px]`}
                                    title="Datum ingekocht (optioneel)"
                                />
                                <button
                                    type="button"
                                    onClick={voegMateriaalToe}
                                    className="bg-[#d6007e] text-white rounded-xl py-2 font-bold min-h-[48px]"
                                >
                                    Materiaal toevoegen
                                </button>
                            </div>
                        </SpecPanel>

                        {project.materialen.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                Nog geen materialen geregistreerd.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {project.materialen.map((m) => (
                                    <li key={m.id}>
                                        <SpecListRow className="flex justify-between gap-4 items-start">
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
                                                        ? formatDate(
                                                              m.ingekochtOp
                                                          )
                                                        : "Nog niet ingekocht"}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="font-semibold">
                                                    {formatEuro(m.kosten)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        verwijderMateriaal(
                                                            m.id
                                                        )
                                                    }
                                                    className="text-red-600 text-xs"
                                                >
                                                    Verwijder
                                                </button>
                                            </div>
                                        </SpecListRow>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SpecPanel>
                </SpecPageCard>
            ) : null}

            {project.workorders.length > 0 ? (
                <SpecPageCard>
                    <SpecPanel title="Gekoppelde opdrachten">
                        <ul className="space-y-2">
                            {project.workorders.map((w) => (
                                <li key={w.id}>
                                    <SpecListRow>
                                        <Link
                                            href={`/workorders/${w.id}`}
                                            className="text-[#d6007e] font-medium"
                                        >
                                            {w.number} — {w.title}
                                        </Link>
                                        <span className="text-xs text-gray-500 ml-2">
                                            {w.status}
                                        </span>
                                    </SpecListRow>
                                </li>
                            ))}
                        </ul>
                    </SpecPanel>
                </SpecPageCard>
            ) : null}

            {isOffice && projectIsActive ? (
                <SpecPageCard>
                    <SpecPanel
                        title="Project afgerond"
                        hint="Het project verplaatst naar de map Afgeronde projecten. Uren en gegevens blijven bewaard."
                    >
                        <button
                            type="button"
                            onClick={markeerProjectAfgerond}
                            disabled={completing}
                            className="w-full bg-gray-900 text-white rounded-xl py-4 min-h-[52px] font-bold text-base disabled:opacity-60"
                        >
                            {completing ? "Bezig…" : "Project afgerond"}
                        </button>
                    </SpecPanel>
                </SpecPageCard>
            ) : null}
            </div>

            <ProjectUrenAfdruk
                number={project.number}
                name={project.name}
                customerName={project.customer.name}
                location={project.location}
                plaats={project.plaats}
                uren={project.uren}
                perMonteur={urenPerMonteur}
                totaalUren={project.gebruikteUren}
            />
        </PageShell>
    );
}
