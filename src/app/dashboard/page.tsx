"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { canAccessOffice } from "@/lib/auth/checkRole";
import { getStatus } from "@/constants/workorderStatus";
import { FORM_DEFINITIONS } from "@/constants/formDefinitions";
import AanvraagSpecificatiesOverzicht from "@/components/aanvraag/AanvraagSpecificatiesOverzicht";
import {
    PageHeader,
    PageShell,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
    SpecStat,
} from "@/components/ui/SpecLayout";

interface OpenAanvraag {
    id: string;
    locatie: string | null;
    straat: string | null;
    huisnummer: string | null;
    postcode: string | null;
    plaats: string | null;
    schermen: string | null;
    beugel: string | null;
    stroom: string | null;
    internet: string | null;
    opmerkingen: string | null;
    aanvragerNaam: string | null;
    specificaties: unknown;
    bijlagen: unknown;
    createdAt: string;
    customer: { name: string };
}

// Sectie op het dashboard met binnengekomen aanvragen van opdrachtgevers.
function AanvragenSectie() {
    const [aanvragen, setAanvragen] = useState<OpenAanvraag[]>([]);
    const [laden, setLaden] = useState(true);
    const [bezigId, setBezigId] = useState("");
    const [open, setOpen] = useState<string>("");

    async function laad() {
        try {
            const res = await fetch("/api/aanvragen");
            if (res.ok) {
                const data = await res.json();
                setAanvragen(data.aanvragen || []);
            }
        } catch {
            // stil
        }
        setLaden(false);
    }

    useEffect(() => {
        laad();
    }, []);

    async function behandel(id: string) {
        setBezigId(id);

        try {
            const res = await fetch(`/api/aanvragen/${id}/behandelen`, {
                method: "POST",
            });

            const data = await res.json();

            if (res.ok && data.workorderId) {
                // Naar de klaarzet/bewerk-pagina om te controleren, plannen en
                // de afspraak te versturen.
                window.location.href = `/workorders/${data.workorderId}/edit`;
            } else {
                setBezigId("");
                laad();
            }
        } catch {
            setBezigId("");
        }
    }

    if (laden || aanvragen.length === 0) {
        return null;
    }

    return (
        <SpecPageCard>
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-sm text-gray-800">
                    Openstaande aanvragen
                </h2>
                <span className="text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">
                    {aanvragen.length}
                </span>
            </div>

            <div className="space-y-2">
                {aanvragen.map((a) => {
                    const adres = [
                        [a.straat, a.huisnummer].filter(Boolean).join(" "),
                        [a.postcode, a.plaats].filter(Boolean).join(" "),
                    ]
                        .filter(Boolean)
                        .join(", ");

                    const isOpen = open === a.id;
                    const aantalBijlagen = Array.isArray(a.bijlagen)
                        ? a.bijlagen.length
                        : 0;

                    return (
                        <SpecListRow key={a.id} className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpen(isOpen ? "" : a.id)
                                    }
                                    className="text-left flex-1 min-w-0"
                                >
                                    <p className="font-semibold text-sm text-gray-900">
                                        {a.customer.name}
                                        {a.locatie ? ` · ${a.locatie}` : ""}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {adres || "Geen adres opgegeven"}
                                        {aantalBijlagen > 0
                                            ? ` · ${aantalBijlagen} bijlage${aantalBijlagen === 1 ? "" : "n"}`
                                            : ""}
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => behandel(a.id)}
                                    disabled={bezigId === a.id}
                                    className="
                                        bg-[#d6007e] text-white
                                        rounded-lg px-3 py-2
                                        text-sm font-semibold
                                        whitespace-nowrap
                                        disabled:opacity-50
                                    "
                                >
                                    {bezigId === a.id
                                        ? "Bezig..."
                                        : "In behandeling nemen"}
                                </button>
                            </div>

                            {isOpen && (
                                <div className="pt-3 border-t border-gray-100">
                                    <AanvraagSpecificatiesOverzicht
                                        snapshot={{
                                            specificaties: a.specificaties,
                                            aanvragerNaam: a.aanvragerNaam,
                                            opmerkingen: a.opmerkingen,
                                            schermen: a.schermen,
                                            beugel: a.beugel,
                                            stroom: a.stroom,
                                            internet: a.internet,
                                        }}
                                        locatie={{
                                            locatie: a.locatie,
                                            straat: a.straat,
                                            huisnummer: a.huisnummer,
                                            postcode: a.postcode,
                                            plaats: a.plaats,
                                            opdrachtgever: a.customer.name,
                                        }}
                                        bijlagen={
                                            Array.isArray(a.bijlagen)
                                                ? (a.bijlagen as {
                                                      url?: string;
                                                      name?: string;
                                                  }[])
                                                : null
                                        }
                                    />
                                </div>
                            )}
                        </SpecListRow>
                    );
                })}
            </div>
        </SpecPageCard>
    );
}

function formIcon(type: string): string {
    return FORM_DEFINITIONS.find((d) => d.type === type)?.icon ?? "📝";
}

function formTypeLabel(type: string): string {
    const map: Record<string, string> = {
        verlof: "Verlof",
        declaratie: "Bon declareren",
        werkplekinspectie: "Werkplekinspectie",
    };

    return (
        map[type] ??
        (FORM_DEFINITIONS.find((d) => d.type === type)?.label ?? type)
    );
}

function nlDate(value: unknown): string {
    if (!value || typeof value !== "string") {
        return "";
    }

    const d = new Date(value);

    if (isNaN(d.getTime())) {
        return "";
    }

    return d.toLocaleDateString("nl-NL");
}

// Korte samenvatting per formulier: bij verlof de van-tot datums
function formSummary(form: {
    type: string;
    data?: { eersteDag?: string; laatsteDag?: string; datum?: string };
}): string {
    if (form.type === "verlof") {
        const from = nlDate(form.data?.eersteDag);
        const to = nlDate(form.data?.laatsteDag);

        if (from && to) {
            return `Verlof · ${from} t/m ${to}`;
        }

        if (from) {
            return `Verlof · ${from}`;
        }

        return "Verlof";
    }

    if (form.type === "declaratie") {
        const datum = nlDate(form.data?.datum);

        return datum ? `Bon declareren · ${datum}` : "Bon declareren";
    }

    return formTypeLabel(form.type);
}

interface DashboardData {
    counters: {
        ingepland: number;
        uitgevoerd: number;
        teLaat: number;
        openForms: number;
        openAanvragen?: number;
        materiaal?: number;
    };
    teLaat: Array<{
        id: string;
        number: string;
        title: string;
        plannedDate: string | null;
        customer?: { name: string } | null;
        project?: { customer?: { name: string } | null } | null;
        assignedUser?: { name: string | null } | null;
    }>;
    materiaalWaarschuwing: Array<{
        id: string;
        number: string;
        title: string;
        customer?: string | null;
        engineer?: string | null;
    }>;
    openFormsList?: Array<{
        id: string;
        type: string;
        title: string;
        status: string;
        createdAt: string;
        user?: { name: string | null } | null;
        data?: { eersteDag?: string; laatsteDag?: string; datum?: string };
    }>;
    recent: Array<{
        id: string;
        number: string;
        title: string;
        status: string;
        customer?: { name: string } | null;
        project?: { customer?: { name: string } | null } | null;
    }>;
    recentForms: Array<{
        id: string;
        type: string;
        status: string;
        user?: { name: string | null } | null;
        data?: { eersteDag?: string; laatsteDag?: string; datum?: string };
    }>;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const { data: session, status } = useSession();
    const userRole = session?.user?.role ?? "";

    useEffect(() => {
        async function load() {
            const response = await fetch("/api/dashboard");
            const result = await response.json();
            setData(result);
            setLoading(false);
        }

        load();
    }, []);

    if (loading) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Dashboard laden...</p>
            </PageShell>
        );
    }

    if (status !== "loading" && !canAccessOffice(userRole)) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Geen toegang</p>
            </PageShell>
        );
    }

    const teLaatCount = data?.counters.teLaat ?? 0;
    const openFormsCount = data?.counters.openForms ?? 0;
    const openAanvragenCount = data?.counters.openAanvragen ?? 0;
    const materiaalCount = data?.counters.materiaal ?? 0;

    return (
        <PageShell>
            <PageHeader
                title="Dashboard"
                subtitle="Overzicht opdrachten en formulieren"
            />

            <AanvragenSectie />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <SpecStat
                    label="Ingepland"
                    value={data?.counters.ingepland ?? 0}
                />
                <SpecStat
                    label="Uitgevoerd"
                    value={data?.counters.uitgevoerd ?? 0}
                />
                <SpecStat
                    label="Open aanvragen"
                    value={
                        openAanvragenCount > 0 ? (
                            <span className="text-amber-700">
                                {openAanvragenCount}
                            </span>
                        ) : (
                            openAanvragenCount
                        )
                    }
                />
                <SpecStat
                    label="Formulieren te behandelen"
                    value={
                        openFormsCount > 0 ? (
                            <span className="text-sky-700">
                                {openFormsCount}
                            </span>
                        ) : (
                            openFormsCount
                        )
                    }
                />
                <SpecStat
                    label="Te laat invullen"
                    value={
                        teLaatCount > 0 ? (
                            <span className="text-red-600">{teLaatCount}</span>
                        ) : (
                            teLaatCount
                        )
                    }
                />
                <SpecStat
                    label="Materiaal klaarzetten"
                    value={
                        materiaalCount > 0 ? (
                            <span className="text-orange-700">
                                {materiaalCount}
                            </span>
                        ) : (
                            materiaalCount
                        )
                    }
                />
            </div>

            {(data?.teLaat?.length ?? 0) > 0 && (
                <SpecPanel
                    title={`Te laat invullen — datum verstreken (${data?.teLaat?.length})`}
                    hint="Geplande datum is voorbij; monteur heeft de opdracht nog niet ingevuld."
                    tone="amber"
                >
                    <div className="space-y-2">
                        {data?.teLaat?.map((workorder) => (
                            <a
                                key={workorder.id}
                                href={`/workorders/${workorder.id}`}
                            >
                                <SpecListRow
                                    className="
                                        flex justify-between items-center gap-3
                                        hover:bg-gray-50
                                    "
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 truncate">
                                            {workorder.number} —{" "}
                                            {workorder.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                            {workorder.customer?.name ??
                                                workorder.project?.customer
                                                    ?.name ??
                                                "—"}
                                            {" · "}
                                            {workorder.assignedUser?.name ??
                                                "Geen monteur"}
                                        </p>
                                    </div>
                                    <span className="text-xs text-amber-800 font-medium shrink-0">
                                        Gepland:{" "}
                                        {workorder.plannedDate
                                            ? new Date(
                                                  workorder.plannedDate
                                              ).toLocaleDateString("nl-NL")
                                            : "—"}
                                    </span>
                                </SpecListRow>
                            </a>
                        ))}
                    </div>
                </SpecPanel>
            )}

            {(data?.materiaalWaarschuwing?.length ?? 0) > 0 && (
                <SpecPanel
                    title={`Materiaal klaarzetten (${data?.materiaalWaarschuwing?.length})`}
                    hint="Installatie is morgen (of de eerstvolgende werkdag). Controleer of materiaal geleverd/klaargezet of op locatie is."
                    tone="amber"
                >
                    <div className="space-y-2">
                        {data?.materiaalWaarschuwing?.map((workorder) => (
                            <a
                                key={workorder.id}
                                href={`/workorders/${workorder.id}/edit`}
                            >
                                <SpecListRow
                                    className="
                                        flex justify-between items-center gap-3
                                        hover:bg-gray-50
                                    "
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 truncate">
                                            {workorder.number} —{" "}
                                            {workorder.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                            {workorder.customer ?? "—"}
                                            {workorder.engineer
                                                ? ` · ${workorder.engineer}`
                                                : ""}
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium text-amber-800 shrink-0">
                                        Controleer materiaal →
                                    </span>
                                </SpecListRow>
                            </a>
                        ))}
                    </div>
                </SpecPanel>
            )}

            {(data?.openFormsList?.length ?? 0) > 0 && (
                <SpecPanel
                    title={`Ingediende formulieren (${data?.openFormsList?.length})`}
                    hint="Formulieren met status ingediend die nog behandeld moeten worden."
                    tone="indigo"
                >
                    <div className="space-y-2">
                        {data?.openFormsList?.map((form) => (
                            <a key={form.id} href={`/forms/${form.id}`}>
                                <SpecListRow
                                    className="
                                        flex justify-between items-center gap-3
                                        hover:bg-gray-50
                                    "
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 truncate">
                                            {form.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                            {form.user?.name ?? "Onbekend"}
                                            {" · "}
                                            {formSummary(form)}
                                            {" · "}
                                            {new Date(
                                                form.createdAt
                                            ).toLocaleDateString("nl-NL")}
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium text-indigo-700 shrink-0">
                                        Behandelen →
                                    </span>
                                </SpecListRow>
                            </a>
                        ))}
                    </div>
                </SpecPanel>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SpecPageCard>
                    <h2 className="font-semibold text-sm text-gray-800">
                        Laatste opdrachten
                    </h2>

                    <div className="space-y-2">
                        {(data?.recent?.length ?? 0) === 0 ? (
                            <p className="text-sm text-gray-500">
                                Nog geen opdrachten.
                            </p>
                        ) : (
                            data?.recent.map((workorder) => (
                                <a
                                    key={workorder.id}
                                    href={`/workorders/${workorder.id}`}
                                >
                                    <SpecListRow
                                        className="
                                            flex justify-between items-center gap-3
                                            hover:bg-gray-50
                                        "
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">
                                                {workorder.number} —{" "}
                                                {workorder.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {workorder.customer?.name ??
                                                    workorder.project?.customer
                                                        ?.name ??
                                                    "—"}
                                            </p>
                                        </div>
                                        <span
                                            className={`
                                                shrink-0 px-2 py-0.5
                                                rounded-full text-xs
                                                ${getStatus(workorder.status).badge}
                                            `}
                                        >
                                            {getStatus(workorder.status).label}
                                        </span>
                                    </SpecListRow>
                                </a>
                            ))
                        )}
                    </div>
                </SpecPageCard>

                <SpecPageCard>
                    <h2 className="font-semibold text-sm text-gray-800">
                        Laatste formulieren
                    </h2>

                    <div className="space-y-2">
                        {(data?.recentForms?.length ?? 0) === 0 ? (
                            <p className="text-sm text-gray-500">
                                Nog geen formulieren.
                            </p>
                        ) : (
                            data?.recentForms?.map((form) => (
                                <a
                                    key={form.id}
                                    href={`/forms/${form.id}`}
                                >
                                    <SpecListRow
                                        className="
                                            flex justify-between items-center gap-3
                                            hover:bg-gray-50
                                        "
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">
                                                {formIcon(form.type)}{" "}
                                                {form.user?.name ?? "Onbekend"}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {formSummary(form)}
                                            </p>
                                        </div>
                                        <span className="shrink-0 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                                            {form.status}
                                        </span>
                                    </SpecListRow>
                                </a>
                            ))
                        )}
                    </div>
                </SpecPageCard>
            </div>
        </PageShell>
    );
}
