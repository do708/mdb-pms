"use client";

import { useEffect, useState } from "react";
import DeleteButton from "@/components/DeleteButton";
import Link from "next/link";
import {
    PageHeader,
    PageShell,
    SpecListRow,
    SpecPageCard,
    specInputClassName,
} from "@/components/ui/SpecLayout";

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    _count?: {
        projects: number;
    };
}

// Knopje dat de unieke publieke aanvraaglink van een klant naar het klembord
// kopieert. Bij de eerste keer wordt server-side een token aangemaakt.
function AanvraagLinkKnop({ customerId }: { customerId: string }) {
    const [bezig, setBezig] = useState(false);
    const [gekopieerd, setGekopieerd] = useState(false);

    async function kopieer() {
        setBezig(true);

        try {
            const res = await fetch(
                `/api/customers/${customerId}/aanvraag-link`,
                {
                    method: "POST",
                }
            );

            const data = await res.json();

            if (res.ok && data.url) {
                try {
                    await navigator.clipboard.writeText(data.url);
                } catch {
                    // Klembord kan geblokkeerd zijn; toon de link dan.
                    window.prompt("Kopieer de aanvraaglink:", data.url);
                }

                setGekopieerd(true);
                setTimeout(() => setGekopieerd(false), 2000);
            }
        } catch {
            // stil falen
        }

        setBezig(false);
    }

    return (
        <button
            type="button"
            onClick={kopieer}
            disabled={bezig}
            title="Kopieer aanvraaglink voor deze opdrachtgever"
            className="
                border rounded-lg px-3 py-1.5 text-sm
                hover:bg-gray-50 disabled:opacity-50
            "
        >
            {gekopieerd ? "✓ Gekopieerd" : "🔗 Link"}
        </button>
    );
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    async function loadCustomers() {
        const response = await fetch("/api/customers");
        const data = await response.json();

        setCustomers(data);
        setLoading(false);
    }

    useEffect(() => {
        loadCustomers();
    }, []);

    const filteredCustomers = customers.filter((customer) =>
        customer.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <PageShell>
            <PageHeader
                title="Opdrachtgevers"
                subtitle="Beheer klanten binnen MDB Project Management Systeem"
                actions={
                    <Link
                        href="/customers/new"
                        className="
                            bg-[#d6007e] text-white
                            px-5 py-3 rounded-xl font-semibold
                        "
                    >
                        + Nieuwe klant
                    </Link>
                }
            />

            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoeken op klantnaam..."
                className={specInputClassName}
            />

            <SpecPageCard>
                {loading ? (
                    <p className="text-sm text-gray-500">
                        Opdrachtgevers laden...
                    </p>
                ) : filteredCustomers.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Geen klanten gevonden.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {filteredCustomers.map((customer) => (
                            <SpecListRow
                                key={customer.id}
                                className="
                                    flex justify-between items-center gap-3
                                "
                            >
                                <div className="min-w-0">
                                    <h2 className="font-bold text-sm text-gray-900">
                                        {customer.name}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {customer.email || "Geen e-mail"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {customer.phone || "Geen telefoon"}
                                    </p>
                                </div>

                                <div className="text-right text-sm text-gray-500 shrink-0">
                                    <p>
                                        📁 {customer._count?.projects || 0}{" "}
                                        projecten
                                    </p>

                                    <div className="mt-3 flex gap-2 justify-end items-center">
                                        <Link
                                            href={`/customers/${customer.id}/edit`}
                                            className="
                                                border rounded-lg
                                                px-3 py-1.5 text-sm
                                                hover:bg-gray-50
                                            "
                                        >
                                            Wijzigen
                                        </Link>

                                        <AanvraagLinkKnop
                                            customerId={customer.id}
                                        />

                                        <DeleteButton
                                            url={`/api/customers/${customer.id}`}
                                            label={`klant ${customer.name}`}
                                            onDeleted={loadCustomers}
                                            compact
                                        />
                                    </div>
                                </div>
                            </SpecListRow>
                        ))}
                    </div>
                )}
            </SpecPageCard>
        </PageShell>
    );
}
