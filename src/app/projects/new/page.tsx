"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
    PageHeader,
    PageShell,
    SpecFieldLabel,
    SpecPageCard,
    SpecPanel,
    specInputClassName,
    specSelectClassName,
} from "@/components/ui/SpecLayout";

interface Customer {
    id: string;
    name: string;
}

export default function NewProjectPage() {
    const router = useRouter();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerId, setCustomerId] = useState("");
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [plaats, setPlaats] = useState("");
    const [geoffreerdeUren, setGeoffreerdeUren] = useState("");
    const [geoffreerdBedrag, setGeoffreerdBedrag] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadCustomers() {
            const response = await fetch("/api/customers");
            const data = await response.json();

            setCustomers(data);
        }

        loadCustomers();
    }, []);

    async function createProject() {
        if (!name || !customerId) {
            alert("Vul projectnaam en opdrachtgever in");
            return;
        }

        if (!location.trim() || !plaats.trim()) {
            const ok = window.confirm(
                "Adres en/of plaats ontbreekt. Zonder volledig adres blijven kilometers bij urenboeken leeg. Toch doorgaan?"
            );
            if (!ok) {
                return;
            }
        }

        setSaving(true);

        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    customerId,
                    location,
                    plaats,
                    geoffreerdeUren,
                    geoffreerdBedrag,
                    status: "actief",
                }),
            });

            if (response.ok) {
                const project = await response.json();
                router.push(`/projects/${project.id}`);
            } else {
                const err = await response.json();
                alert(err.error || "Project aanmaken mislukt");
            }
        } catch (error) {
            console.error(error);
            alert("Er ging iets fout");
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageShell className="max-w-2xl">
            <PageHeader
                title="Nieuw project"
                actions={
                    <Link
                        href="/projects"
                        className="
                            inline-flex items-center rounded-lg border
                            border-gray-200 bg-white px-3 py-2
                            text-sm font-medium text-gray-700
                            hover:bg-gray-50
                        "
                    >
                        ← Terug naar projecten
                    </Link>
                }
            />

            <SpecPageCard>
                <SpecPanel tone="white" className="space-y-4">
                    <label className="block">
                        <SpecFieldLabel>Opdrachtgever</SpecFieldLabel>
                        <select
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className={specSelectClassName}
                        >
                            <option value="">Kies opdrachtgever</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <SpecFieldLabel>Projectnaam</SpecFieldLabel>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Bijv. Rosa Spier"
                            className={specInputClassName}
                        />
                    </label>

                    <div className="grid sm:grid-cols-[1.4fr_1fr] gap-3">
                        <label className="block">
                            <SpecFieldLabel>Adres</SpecFieldLabel>
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Bijv. Brink 12"
                                className={specInputClassName}
                            />
                        </label>
                        <label className="block">
                            <SpecFieldLabel>Plaats</SpecFieldLabel>
                            <input
                                value={plaats}
                                onChange={(e) => setPlaats(e.target.value)}
                                placeholder="Bijv. Laren"
                                className={specInputClassName}
                            />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500">
                        Adres en plaats helpen bij planning en rapportages.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <label className="block">
                            <SpecFieldLabel>Geoffreerde uren</SpecFieldLabel>
                            <input
                                type="number"
                                min={0}
                                step={0.5}
                                value={geoffreerdeUren}
                                onChange={(e) =>
                                    setGeoffreerdeUren(e.target.value)
                                }
                                placeholder="Bijv. 40"
                                className={specInputClassName}
                            />
                        </label>
                        <label className="block">
                            <SpecFieldLabel>
                                Geoffreerd bedrag (€)
                            </SpecFieldLabel>
                            <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={geoffreerdBedrag}
                                onChange={(e) =>
                                    setGeoffreerdBedrag(e.target.value)
                                }
                                placeholder="Optioneel"
                                className={specInputClassName}
                            />
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={createProject}
                        disabled={saving}
                        className="w-full bg-[#d6007e] text-white rounded-xl py-4 font-bold disabled:opacity-60"
                    >
                        {saving ? "Opslaan…" : "Project aanmaken"}
                    </button>
                </SpecPanel>
            </SpecPageCard>
        </PageShell>
    );
}
