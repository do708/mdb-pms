"use client";

import { useEffect, useState } from "react";
import DeleteButton from "@/components/DeleteButton";
import Link from "next/link";
import {
    PageHeader,
    PageShell,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
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

function contactRegel(customer: Customer): string {
    const delen = [customer.email, customer.phone, customer.address].filter(
        Boolean
    ) as string[];

    return delen.length > 0 ? delen.join(" · ") : "Geen contactgegevens";
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
                border border-gray-200 rounded-lg px-3 py-1.5 text-sm
                text-gray-700 hover:bg-gray-50 disabled:opacity-50
            "
        >
            {gekopieerd ? "✓ Gekopieerd" : "🔗 Aanvraaglink"}
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
                subtitle="Beheer opdrachtgevers binnen MDB"
                actions={
                    <Link
                        href="/customers/new"
                        className="
                            bg-[#d6007e] text-white
                            px-5 py-3 rounded-xl font-semibold
                        "
                    >
                        + Nieuwe opdrachtgever
                    </Link>
                }
            />

            <SpecPanel tone="slate">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Zoeken op naam..."
                    className={specInputClassName}
                />
            </SpecPanel>

            <SpecPageCard>
                {loading ? (
                    <p className="text-sm text-gray-500">
                        Opdrachtgevers laden...
                    </p>
                ) : filteredCustomers.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Geen opdrachtgevers gevonden.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {filteredCustomers.map((customer) => {
                            const projecten =
                                customer._count?.projects || 0;

                            return (
                                <SpecListRow
                                    key={customer.id}
                                    className="
                                        flex flex-col gap-3
                                        sm:flex-row sm:items-center
                                        sm:justify-between
                                    "
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="font-bold text-sm text-gray-900">
                                                {customer.name}
                                            </h2>
                                            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                                                {projecten}{" "}
                                                {projecten === 1
                                                    ? "project"
                                                    : "projecten"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                            {contactRegel(customer)}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 items-center shrink-0">
                                        <Link
                                            href={`/customers/${customer.id}/edit`}
                                            className="
                                                border border-gray-200
                                                rounded-lg px-3 py-1.5
                                                text-sm text-gray-700
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
                                            label={`opdrachtgever ${customer.name}`}
                                            onDeleted={loadCustomers}
                                            compact
                                        />
                                    </div>
                                </SpecListRow>
                            );
                        })}
                    </div>
                )}
            </SpecPageCard>
        </PageShell>
    );
}
