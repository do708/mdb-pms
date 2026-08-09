"use client";

import { useEffect, useState } from "react";

import { getStatus } from "@/constants/workorderStatus";
import { FORM_DEFINITIONS } from "@/constants/formDefinitions";
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

function formIcon(type: string): string {
    return FORM_DEFINITIONS.find((d) => d.type === type)?.icon ?? "📝";
}

interface Workorder {
    id: string;
    number: string;
    title: string;
    status: string;
    plannedDate: string | null;
    customer: { name: string } | null;
    project: { customer: { name: string } | null } | null;
    assignedUser: { name: string | null } | null;
}

interface Form {
    id: string;
    type: string;
    title: string;
    status: string;
    createdAt: string;
    user: { name: string | null } | null;
}

export default function ArchivePage() {
    const [q, setQ] = useState("");
    const [customer, setCustomer] = useState("");
    const [engineer, setEngineer] = useState("");
    const [customerOptions, setCustomerOptions] = useState<
        { id: string; name: string }[]
    >([]);
    const [engineerOptions, setEngineerOptions] = useState<
        { id: string; name: string | null }[]
    >([]);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [type, setType] = useState("");
    const [workorders, setWorkorders] = useState<Workorder[]>([]);
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);

    async function search() {
        setLoading(true);

        const params = new URLSearchParams();

        if (q) params.set("q", q);
        if (customer) params.set("customer", customer);
        if (engineer) params.set("engineer", engineer);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (type) params.set("type", type);

        const response = await fetch(`/api/archive?${params.toString()}`);

        if (response.ok) {
            const data = await response.json();
            setWorkorders(data.workorders ?? []);
            setForms(data.forms ?? []);
        }

        setLoading(false);
    }

    // Bij het openen meteen laden; daarna op knop
    useEffect(() => {
        search();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Opties voor de dropdowns ophalen
    useEffect(() => {
        (async () => {
            try {
                const [c, e] = await Promise.all([
                    fetch("/api/customers"),
                    fetch("/api/engineers"),
                ]);

                const cData = await c.json();
                const eData = await e.json();

                setCustomerOptions(Array.isArray(cData) ? cData : []);
                setEngineerOptions(Array.isArray(eData) ? eData : []);
            } catch {
                // stil falen; dan blijven het lege dropdowns
            }
        })();
    }, []);

    function reset() {
        setQ("");
        setCustomer("");
        setEngineer("");
        setFrom("");
        setTo("");
        setType("");
    }

    return (
        <PageShell>
            <PageHeader
                title="Archief"
                subtitle="Afgeronde opdrachten en oudere formulieren"
            />

            <SpecPanel title="Filters" tone="slate">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Zoek op opdracht / nummer"
                        className={specInputClassName}
                    />

                    <select
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        className={specSelectClassName}
                    >
                        <option value="">Alle opdrachtgevers</option>
                        {customerOptions.map((c) => (
                            <option key={c.id} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={engineer}
                        onChange={(e) => setEngineer(e.target.value)}
                        className={specSelectClassName}
                    >
                        <option value="">Alle monteurs</option>
                        {engineerOptions.map((e) => (
                            <option key={e.id} value={e.name ?? ""}>
                                {e.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="block">
                        <SpecFieldLabel>Van</SpecFieldLabel>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className={specInputClassName}
                        />
                    </label>

                    <label className="block">
                        <SpecFieldLabel>Tot</SpecFieldLabel>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className={specInputClassName}
                        />
                    </label>

                    <label className="block">
                        <SpecFieldLabel>Soort</SpecFieldLabel>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className={specSelectClassName}
                        >
                            <option value="">Alles</option>
                            <option value="werkbon">Opdrachten</option>
                            <option value="formulier">Formulieren</option>
                        </select>
                    </label>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={search}
                        className="bg-black text-white rounded-xl px-5 py-2.5 font-medium"
                    >
                        Zoeken
                    </button>

                    <button
                        onClick={() => {
                            reset();
                        }}
                        className="border rounded-xl px-5 py-2.5"
                    >
                        Wissen
                    </button>
                </div>
            </SpecPanel>

            {loading && <p className="text-sm text-gray-500">Laden...</p>}

            {type !== "formulier" && (
                <SpecPageCard>
                    <h2 className="font-semibold text-sm text-gray-800">
                        📋 Opdrachten ({workorders.length})
                    </h2>

                    <div className="space-y-2">
                        {workorders.map((workorder) => (
                            <a
                                key={workorder.id}
                                href={`/workorders/${workorder.id}`}
                                className="block"
                            >
                                <SpecListRow className="flex justify-between items-center hover:bg-gray-50">
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {workorder.number} — {workorder.title}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            🏢{" "}
                                            {workorder.customer?.name ??
                                                workorder.project?.customer
                                                    ?.name ??
                                                "—"}
                                            {" · 👷 "}
                                            {workorder.assignedUser?.name ?? "—"}
                                            {workorder.plannedDate
                                                ? " · " +
                                                  new Date(
                                                      workorder.plannedDate
                                                  ).toLocaleDateString("nl-NL")
                                                : ""}
                                        </p>
                                    </div>
                                    <span
                                        className={`
                                            shrink-0 ml-2 px-2 py-0.5
                                            rounded-full text-xs
                                            ${getStatus(workorder.status).badge}
                                        `}
                                    >
                                        {getStatus(workorder.status).label}
                                    </span>
                                </SpecListRow>
                            </a>
                        ))}

                        {!loading && workorders.length === 0 && (
                            <p className="text-sm text-gray-400">
                                Geen opdrachten gevonden.
                            </p>
                        )}
                    </div>
                </SpecPageCard>
            )}

            {type !== "werkbon" && (
                <SpecPageCard>
                    <h2 className="font-semibold text-sm text-gray-800">
                        📝 Formulieren ({forms.length})
                    </h2>

                    <div className="space-y-2">
                        {forms.map((form) => (
                            <a
                                key={form.id}
                                href={`/forms/${form.id}`}
                                className="block"
                            >
                                <SpecListRow className="flex justify-between items-center hover:bg-gray-50">
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {formIcon(form.type)} {form.title}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {form.user?.name ?? ""}
                                            {" · "}
                                            {new Date(
                                                form.createdAt
                                            ).toLocaleDateString("nl-NL")}
                                        </p>
                                    </div>
                                </SpecListRow>
                            </a>
                        ))}

                        {!loading && forms.length === 0 && (
                            <p className="text-sm text-gray-400">
                                Geen formulieren gevonden.
                            </p>
                        )}
                    </div>
                </SpecPageCard>
            )}
        </PageShell>
    );
}
