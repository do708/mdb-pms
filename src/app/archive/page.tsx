"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";

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
    archiveStatus: string | null;
    archiveLocationLabel: string | null;
    customer: { name: string } | null;
    project: { customer: { name: string | null } | null } | null;
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

interface ArchiveWorkorderRef {
    id: string;
    number: string;
    title: string;
    status: string;
    archivedAt: string | null;
    archiveStatus: string | null;
    archiveNasPath: string | null;
    plannedDate: string | null;
}

interface ArchiveFolderNode {
    id: string;
    kind: string;
    name: string;
    nasPath: string;
    children?: ArchiveFolderNode[];
    workorder?: ArchiveWorkorderRef | null;
    _count?: { children: number };
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
    const [folders, setFolders] = useState<ArchiveFolderNode[]>([]);
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(
        {}
    );
    const [loading, setLoading] = useState(true);
    const [foldersLoading, setFoldersLoading] = useState(true);

    async function loadFolders() {
        setFoldersLoading(true);

        try {
            const response = await fetch("/api/archive/folders");

            if (response.ok) {
                const data = await response.json();
                setFolders(Array.isArray(data.folders) ? data.folders : []);
            }
        } catch {
            // stil
        }

        setFoldersLoading(false);
    }

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

    useEffect(() => {
        search();
        loadFolders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                // stil
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

    function folderKey(parts: string[]) {
        return parts.join(":");
    }

    function toggleFolder(key: string) {
        setOpenFolders((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    }

    function renderLocationFolder(
        customerId: string,
        location: ArchiveFolderNode
    ) {
        const key = folderKey(["loc", customerId, location.id]);
        const open = openFolders[key] !== false;
        const workorderFolders = location.children ?? [];

        return (
            <SpecPanel key={location.id} tone="white" className="!p-0 overflow-hidden ml-4">
                <button
                    type="button"
                    onClick={() => toggleFolder(key)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] hover:bg-gray-50 text-left"
                >
                    {open ? (
                        <ChevronDown size={18} />
                    ) : (
                        <ChevronRight size={18} />
                    )}
                    <Folder size={18} className="text-sky-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                            {location.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {workorderFolders.length} opdracht
                            {workorderFolders.length === 1 ? "" : "en"}
                        </p>
                    </div>
                </button>

                {open && workorderFolders.length > 0 ? (
                    <div className="border-t px-3 py-2 space-y-1">
                        {workorderFolders.map((woFolder) => {
                            const wo = woFolder.workorder;

                            if (!wo) {
                                return null;
                            }

                            return (
                                <Link
                                    key={woFolder.id}
                                    href={`/workorders/${wo.id}`}
                                    className="block"
                                >
                                    <SpecListRow className="hover:bg-gray-50 py-2">
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {wo.number} — {wo.title}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {wo.archiveStatus === "completed"
                                                    ? "Gearchiveerd op NAS"
                                                    : wo.archiveStatus === "pending"
                                                      ? "Archiveren…"
                                                      : wo.archiveStatus === "failed"
                                                        ? "Archief mislukt"
                                                        : "Nog niet gearchiveerd"}
                                                {wo.plannedDate
                                                    ? ` · ${new Date(wo.plannedDate).toLocaleDateString("nl-NL")}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </SpecListRow>
                                </Link>
                            );
                        })}
                    </div>
                ) : null}
            </SpecPanel>
        );
    }

    function renderCustomerFolder(customerFolder: ArchiveFolderNode) {
        const key = folderKey(["cust", customerFolder.id]);
        const open = openFolders[key] !== false;
        const locations = customerFolder.children ?? [];

        return (
            <SpecPanel
                key={customerFolder.id}
                tone="white"
                className="!p-0 overflow-hidden"
            >
                <button
                    type="button"
                    onClick={() => toggleFolder(key)}
                    className="w-full flex items-center gap-3 px-3 py-3 min-h-[52px] hover:bg-gray-50 text-left"
                >
                    {open ? (
                        <ChevronDown size={20} />
                    ) : (
                        <ChevronRight size={20} />
                    )}
                    <Folder size={20} className="text-[#0066FF] shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">
                            {customerFolder.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {locations.length} locatie
                            {locations.length === 1 ? "" : "s"}
                        </p>
                    </div>
                </button>

                {open ? (
                    <div className="border-t px-2 py-2 space-y-2">
                        {locations.length === 0 ? (
                            <p className="text-xs text-gray-400 px-2 py-1">
                                Nog geen locatiemappen.
                            </p>
                        ) : (
                            locations.map((loc) =>
                                renderLocationFolder(
                                    customerFolder.id,
                                    loc
                                )
                            )
                        )}
                    </div>
                ) : null}
            </SpecPanel>
        );
    }

    return (
        <PageShell>
            <PageHeader
                title="Archief"
                subtitle="Opdrachtgevers, locaties en gearchiveerde opdrachten op NAS"
            />

            <SpecPageCard>
                <h2 className="font-semibold text-sm text-gray-800">
                    Mappenstructuur
                </h2>
                <p className="text-xs text-gray-500">
                    Standaard één map per opdrachtgever; locaties als{" "}
                    <span className="font-medium">Locatienaam, Plaats</span>.
                </p>

                {foldersLoading ? (
                    <p className="text-sm text-gray-500">Mappen laden…</p>
                ) : folders.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Nog geen archiefmappen. Zorg dat opdrachtgevers in PMS
                        staan.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {folders.map((folder) =>
                            renderCustomerFolder(folder)
                        )}
                    </div>
                )}
            </SpecPageCard>

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

            {loading && (
                <p className="text-sm text-gray-500">Laden...</p>
            )}

            {type !== "formulier" && (
                <SpecPageCard>
                    <h2 className="font-semibold text-sm text-gray-800">
                        Opdrachten ({workorders.length})
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
                                            {workorder.number} —{" "}
                                            {workorder.title}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {workorder.archiveLocationLabel
                                                ? `${workorder.archiveLocationLabel} · `
                                                : ""}
                                            {workorder.customer?.name ??
                                                workorder.project?.customer
                                                    ?.name ??
                                                "—"}
                                            {" · "}
                                            {workorder.assignedUser?.name ??
                                                "—"}
                                            {workorder.plannedDate
                                                ? ` · ${new Date(workorder.plannedDate).toLocaleDateString("nl-NL")}`
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
