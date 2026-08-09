"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import { FORM_DEFINITIONS } from "@/constants/formDefinitions";
import {
    PageHeader,
    PageShell,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
} from "@/components/ui/SpecLayout";

interface FormItem {
    id: string;
    type: string;
    title: string;
    status: string;
    createdAt: string;
    user: {
        name: string | null;
    };
}

export default function FormsPage() {
    const [forms, setForms] = useState<FormItem[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        const response = await fetch("/api/forms");
        const data = await response.json();

        setForms(Array.isArray(data) ? data : []);
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <PageShell>
            <PageHeader
                title="Formulieren"
                subtitle="Declaraties, verlofaanvragen en inspecties"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {FORM_DEFINITIONS.map((definition) => (
                    <Link
                        key={definition.type}
                        href={`/forms/new/${definition.type}`}
                        className="block"
                    >
                        <SpecPanel
                            title={definition.label}
                            hint={definition.description}
                            className="hover:border-sky-300 hover:bg-sky-50/40 transition h-full"
                        />
                    </Link>
                ))}
            </div>

            <SpecPageCard>
                <h2 className="font-semibold text-sm text-gray-800">
                    Ingediende formulieren
                </h2>

                {loading && (
                    <p className="text-sm text-gray-500">Laden...</p>
                )}

                {!loading && forms.length === 0 && (
                    <p className="text-sm text-gray-500">
                        Nog geen formulieren ingediend.
                    </p>
                )}

                <div className="space-y-2">
                    {forms.map((form) => (
                        <div
                            key={form.id}
                            className="flex items-center gap-2"
                        >
                            <Link
                                href={`/forms/${form.id}`}
                                className="flex-1 min-w-0"
                            >
                                <SpecListRow className="flex justify-between items-center hover:bg-gray-50">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-gray-900">
                                            {form.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(
                                                form.createdAt
                                            ).toLocaleDateString("nl-NL")}
                                            {" · "}
                                            {form.user.name}
                                        </p>
                                    </div>

                                    <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-0.5 shrink-0">
                                        {form.status}
                                    </span>
                                </SpecListRow>
                            </Link>

                            <DeleteButton
                                url={`/api/forms/${form.id}`}
                                label={`formulier "${form.title}"`}
                                onDeleted={load}
                                compact
                            />
                        </div>
                    ))}
                </div>
            </SpecPageCard>
        </PageShell>
    );
}
