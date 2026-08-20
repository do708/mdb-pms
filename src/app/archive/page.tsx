"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { FORM_DEFINITIONS } from "@/constants/formDefinitions";
import ArchiveTree, {
    type ArchiveWorkorder,
    type StoredFolder,
} from "@/components/archive/ArchiveTree";
import {
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

interface Form {
    id: string;
    type: string;
    title: string;
    status: string;
    createdAt: string;
    user: { name: string | null } | null;
}

export default function ArchivePage() {
    const { data: session } = useSession();
    const role = session?.user?.role ?? "";
    const canManage = role === "admin" || role === "office";
    const showMonteurFilter = canManage;

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
    const [workorders, setWorkorders] = useState<ArchiveWorkorder[]>([]);
    const [storedFolders, setStoredFolders] = useState<StoredFolder[]>([]);
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadFolders() {
        const response = await fetch("/api/archive/folders");

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        setStoredFolders(data.folders ?? []);
    }

    async function search() {
        setLoading(true);

        const params = new URLSearchParams();

        if (q) params.set("q", q);
        if (customer) params.set("customer", customer);
        if (showMonteurFilter && engineer) params.set("engineer", engineer);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (type) params.set("type", type);

        const [archiveRes] = await Promise.all([
            fetch(`/api/archive?${params.toString()}`),
            loadFolders(),
        ]);

        if (archiveRes.ok) {
            const data = await archiveRes.json();
            setWorkorders(data.workorders ?? []);
            setForms(data.forms ?? []);
        }

        setLoading(false);
    }

    useEffect(() => {
        search();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const customerRes = await fetch("/api/customers");
                const cData = await customerRes.json();
                setCustomerOptions(Array.isArray(cData) ? cData : []);

                if (!showMonteurFilter) {
                    setEngineerOptions([]);
                    return;
                }

                const engineerRes = await fetch("/api/engineers");
                const eData = await engineerRes.json();
                setEngineerOptions(Array.isArray(eData) ? eData : []);
            } catch {
                // stil
            }
        })();
    }, [showMonteurFilter]);

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
            <SpecPanel title="Filters" tone="slate">
                <div
                    className={`grid grid-cols-1 gap-3 ${
                        showMonteurFilter
                            ? "md:grid-cols-3"
                            : "md:grid-cols-2"
                    }`}
                >
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

                    {showMonteurFilter ? (
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
                    ) : null}
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

            {loading && (
                <p className="text-sm text-gray-500">Laden...</p>
            )}

            {type !== "formulier" && (
                <SpecPageCard>
                    <h2 className="font-semibold text-sm text-gray-800">
                        Opdrachten ({workorders.length})
                    </h2>

                    {canManage ? (
                        <p className="text-xs text-gray-500 -mt-1">
                            Mappen aanmaken of hernoemen, en bestanden
                            slepen naar een map.
                        </p>
                    ) : null}

                    <ArchiveTree
                        workorders={workorders}
                        storedFolders={storedFolders}
                        canManage={canManage}
                        onRefresh={async () => {
                            await loadFolders();
                        }}
                    />

                    {!loading && workorders.length === 0 && storedFolders.length === 0 && (
                        <p className="text-sm text-gray-400">
                            Geen opdrachten gevonden.
                        </p>
                    )}
                </SpecPageCard>
            )}

            {type !== "werkbon" && (
                <SpecPageCard>
                    <h2 className="font-semibold text-sm text-gray-800">
                        Formulieren ({forms.length})
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
