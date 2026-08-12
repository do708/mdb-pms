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
import {
    buildVerlofTitle,
    verlofSubtitle,
} from "@/lib/forms/formDisplay";

interface FormItem {
    id: string;
    type: string;
    title: string;
    status: string;
    createdAt: string;
    data?: Record<string, unknown>;
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
                            className="hover:border-sky-300 hover:bg-sky-50/40 transition h-full"
                        >
                            <p className="text-2xl leading-none" aria-hidden>
                                {definition.icon}
                            </p>
                            <div className="space-y-0.5">
                                <p className="font-semibold text-sm text-gray-800">
                                    {definition.label}
                                </p>
                                <p className="text-xs text-gray-500 leading-snug">
                                    {definition.description}
                                </p>
                            </div>
                        </SpecPanel>
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
                    {forms.map((form) => {
                        const definition = FORM_DEFINITIONS.find(
                            (d) => d.type === form.type
                        );
                        const title =
                            form.type === "verlof"
                                ? buildVerlofTitle(
                                      form.data,
                                      form.user.name
                                  )
                                : form.title;
                        const subtitle =
                            form.type === "verlof"
                                ? verlofSubtitle(form.data)
                                : `${new Date(form.createdAt).toLocaleDateString("nl-NL")} · ${form.user.name ?? "Onbekend"}`;

                        return (
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
                                            {definition?.icon && (
                                                <span aria-hidden>
                                                    {definition.icon}{" "}
                                                </span>
                                            )}
                                            {title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {subtitle}
                                        </p>
                                    </div>

                                    <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-0.5 shrink-0">
                                        {form.status}
                                    </span>
                                </SpecListRow>
                            </Link>

                            <DeleteButton
                                url={`/api/forms/${form.id}`}
                                label={`formulier "${title}"`}
                                onDeleted={load}
                                compact
                            />
                        </div>
                        );
                    })}
                </div>
            </SpecPageCard>
        </PageShell>
    );
}
