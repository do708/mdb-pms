"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        <div className="space-y-6 -m-2 max-w-2xl">
            <header>
                <Link
                    href="/projects"
                    className="text-sm text-[#d6007e] font-medium"
                >
                    ← Terug naar projecten
                </Link>
                <h1 className="text-2xl font-bold mt-2">Nieuw project</h1>
            </header>

            <section className="bg-white border rounded-2xl p-6 space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                    Opdrachtgever
                </label>
                <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full border rounded-xl p-3"
                >
                    <option value="">Kies opdrachtgever</option>
                    {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                            {customer.name}
                        </option>
                    ))}
                </select>

                <label className="block text-sm font-medium text-gray-700">
                    Projectnaam
                </label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Bijv. Rosa Spier"
                    className="w-full border rounded-xl p-3"
                />

                <div className="grid sm:grid-cols-[1.4fr_1fr] gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adres
                        </label>
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Bijv. Brink 12"
                            className="w-full border rounded-xl p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plaats
                        </label>
                        <input
                            value={plaats}
                            onChange={(e) => setPlaats(e.target.value)}
                            placeholder="Bijv. Laren"
                            className="w-full border rounded-xl p-3"
                        />
                    </div>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                    Zonder adres en plaats kunnen kilometers niet
                    betrouwbaar worden berekend bij uren boeken.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Geoffreerde uren
                        </label>
                        <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={geoffreerdeUren}
                            onChange={(e) =>
                                setGeoffreerdeUren(e.target.value)
                            }
                            placeholder="Bijv. 40"
                            className="w-full border rounded-xl p-3 mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Geoffreerd bedrag (€)
                        </label>
                        <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={geoffreerdBedrag}
                            onChange={(e) =>
                                setGeoffreerdBedrag(e.target.value)
                            }
                            placeholder="Optioneel"
                            className="w-full border rounded-xl p-3 mt-1"
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={createProject}
                    disabled={saving}
                    className="w-full bg-[#d6007e] text-white rounded-xl py-4 font-bold disabled:opacity-60"
                >
                    {saving ? "Opslaan…" : "Project aanmaken"}
                </button>
            </section>
        </div>
    );
}
