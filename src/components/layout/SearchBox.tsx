"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Search } from "lucide-react";

interface Results {
    workorders: {
        id: string;
        number: string;
        title: string;
        customer?: { name: string } | null;
    }[];
    projects: {
        id: string;
        number: string;
        name: string;
        location: string | null;
        customer?: { name: string } | null;
    }[];
    forms: {
        id: string;
        title: string;
        user?: { name: string | null } | null;
    }[];
    users: {
        id: string;
        name: string | null;
        email: string;
        role: string;
    }[];
    customers: { id: string; name: string }[];
    assignments: {
        id: string;
        number: string;
        title: string;
        customer?: { name: string } | null;
    }[];
    documents: {
        id: string;
        name: string;
        type: string;
        workorder?: { id: string; number: string } | null;
    }[];
    aanvragen: {
        id: string;
        locatie: string | null;
        plaats: string | null;
        customer?: { name: string } | null;
    }[];
}

const EMPTY: Results = {
    workorders: [],
    projects: [],
    forms: [],
    users: [],
    customers: [],
    assignments: [],
    documents: [],
    aanvragen: [],
};

function ResultSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-1">
            <p className="text-xs font-semibold text-gray-400 px-3 pt-2 pb-1">
                {title}
            </p>
            {children}
        </div>
    );
}

function ResultButton({
    onClick,
    children,
}: {
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
        >
            {children}
        </button>
    );
}

export default function SearchBox() {
    const router = useRouter();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Results>(EMPTY);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults(EMPTY);
            return;
        }

        setLoading(true);

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `/api/search?q=${encodeURIComponent(query.trim())}`
                );

                if (response.ok) {
                    setResults(await response.json());
                }
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (
                boxRef.current &&
                !boxRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", onClick);

        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    function go(url: string) {
        setOpen(false);
        setQuery("");
        setResults(EMPTY);
        router.push(url);
    }

    const total =
        results.workorders.length +
        results.projects.length +
        results.forms.length +
        results.users.length +
        results.customers.length +
        results.assignments.length +
        results.documents.length +
        results.aanvragen.length;

    return (
        <div ref={boxRef} className="relative">
            <div className="flex items-center w-[420px] h-11 bg-gray-50 border border-gray-200 rounded-xl px-4">
                <Search size={19} className="text-gray-400" />

                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder="Zoeken..."
                    className="ml-3 w-full bg-transparent outline-none text-sm text-gray-700"
                />
            </div>

            {open && query.trim().length >= 2 ? (
                <div className="absolute top-12 left-0 w-[420px] max-h-[70vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
                    {loading ? (
                        <p className="text-sm text-gray-400 p-3">Zoeken...</p>
                    ) : null}

                    {!loading && total === 0 ? (
                        <p className="text-sm text-gray-400 p-3">
                            Niets gevonden voor &quot;{query}&quot;
                        </p>
                    ) : null}

                    {results.projects.length > 0 ? (
                        <ResultSection title="Projecten">
                            {results.projects.map((p) => (
                                <ResultButton
                                    key={p.id}
                                    onClick={() => go(`/projects/${p.id}`)}
                                >
                                    📁 {p.name}
                                    {p.location ? ` · ${p.location}` : ""}
                                    <span className="text-gray-400">
                                        {" "}
                                        · {p.number}
                                        {p.customer?.name
                                            ? ` · ${p.customer.name}`
                                            : ""}
                                    </span>
                                </ResultButton>
                            ))}
                        </ResultSection>
                    ) : null}

                    {results.workorders.length > 0 ? (
                        <ResultSection title="Werkbonnen">
                            {results.workorders.map((w) => (
                                <ResultButton
                                    key={w.id}
                                    onClick={() => go(`/workorders/${w.id}`)}
                                >
                                    📋 {w.number} — {w.title}
                                    <span className="text-gray-400">
                                        {" "}
                                        · {w.customer?.name ?? "—"}
                                    </span>
                                </ResultButton>
                            ))}
                        </ResultSection>
                    ) : null}

                    {results.forms.length > 0 ? (
                        <ResultSection title="Formulieren">
                            {results.forms.map((f) => (
                                <ResultButton
                                    key={f.id}
                                    onClick={() => go(`/forms/${f.id}`)}
                                >
                                    📝 {f.title}
                                    <span className="text-gray-400">
                                        {" "}
                                        · {f.user?.name ?? "—"}
                                    </span>
                                </ResultButton>
                            ))}
                        </ResultSection>
                    ) : null}

                    {results.assignments.length > 0 ? (
                        <ResultSection title="Opdrachten">
                            {results.assignments.map((a) => (
                                <ResultButton
                                    key={a.id}
                                    onClick={() =>
                                        go(`/assignments/${a.id}`)
                                    }
                                >
                                    📂 {a.number} — {a.title}
                                    <span className="text-gray-400">
                                        {" "}
                                        · {a.customer?.name ?? "—"}
                                    </span>
                                </ResultButton>
                            ))}
                        </ResultSection>
                    ) : null}

                    {results.customers.length > 0 ? (
                        <ResultSection title="Opdrachtgevers">
                            {results.customers.map((c) => (
                                <ResultButton
                                    key={c.id}
                                    onClick={() =>
                                        go(`/customers/${c.id}/edit`)
                                    }
                                >
                                    🏢 {c.name}
                                </ResultButton>
                            ))}
                        </ResultSection>
                    ) : null}

                    {results.users.length > 0 ? (
                        <ResultSection title="Gebruikers">
                            {results.users.map((u) => (
                                <ResultButton
                                    key={u.id}
                                    onClick={() => go(`/users/${u.id}`)}
                                >
                                    👤 {u.name ?? u.email}
                                    <span className="text-gray-400">
                                        {" "}
                                        · {u.role}
                                    </span>
                                </ResultButton>
                            ))}
                        </ResultSection>
                    ) : null}

                    {results.documents.length > 0 ? (
                        <ResultSection title="Documenten">
                            {results.documents.map((d) => (
                                <ResultButton
                                    key={d.id}
                                    onClick={() => {
                                        if (d.workorder?.id) {
                                            go(
                                                `/workorders/${d.workorder.id}`
                                            );
                                        } else {
                                            go("/documents");
                                        }
                                    }}
                                >
                                    📄 {d.name}
                                    <span className="text-gray-400">
                                        {" "}
                                        · {d.type}
                                        {d.workorder?.number
                                            ? ` · ${d.workorder.number}`
                                            : ""}
                                    </span>
                                </ResultButton>
                            ))}
                        </ResultSection>
                    ) : null}

                    {results.aanvragen.length > 0 ? (
                        <ResultSection title="Aanvragen">
                            {results.aanvragen.map((a) => (
                                <ResultButton
                                    key={a.id}
                                    onClick={() => go("/dashboard")}
                                >
                                    📥{" "}
                                    {a.locatie ||
                                        a.plaats ||
                                        "Aanvraag"}
                                    <span className="text-gray-400">
                                        {" "}
                                        · {a.customer?.name ?? "—"}
                                    </span>
                                </ResultButton>
                            ))}
                        </ResultSection>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
