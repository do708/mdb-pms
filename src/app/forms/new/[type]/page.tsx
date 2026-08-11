"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import DynamicForm, { FormValues } from "@/components/forms/DynamicForm";
import { getFormDefinition } from "@/constants/formDefinitions";
import {
    PageHeader,
    PageShell,
    SpecPageCard,
} from "@/components/ui/SpecLayout";

export default function NewFormPage() {
    const params = useParams();
    const router = useRouter();
    const type = params.type as string;
    const definition = getFormDefinition(type);
    const [saving, setSaving] = useState(false);

    if (!definition) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">
                    Onbekend formuliertype.
                </p>
            </PageShell>
        );
    }

    async function submit(values: FormValues) {
        setSaving(true);

        try {
            const response = await fetch("/api/forms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    data: values,
                }),
            });

            if (response.ok) {
                const created = await response.json();
                router.push(`/forms/${created.id}`);
            } else {
                alert("Formulier opslaan mislukt");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageShell>
            <PageHeader
                title={
                    <span className="inline-flex items-center gap-2">
                        <span aria-hidden>{definition.icon}</span>
                        <span>{definition.label}</span>
                    </span>
                }
                subtitle={definition.description}
                actions={
                    <Link
                        href="/forms"
                        className="
                            inline-flex items-center rounded-lg border
                            border-gray-200 bg-white px-3 py-2
                            text-sm font-medium text-gray-700
                            hover:bg-gray-50
                        "
                    >
                        ← Formulieren
                    </Link>
                }
            />

            <SpecPageCard className="min-w-0 overflow-hidden">
                <DynamicForm
                    definition={definition}
                    onSubmit={submit}
                    saving={saving}
                />
            </SpecPageCard>
        </PageShell>
    );
}
