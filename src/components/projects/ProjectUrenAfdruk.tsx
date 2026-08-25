"use client";

import { formatHoursDisplay } from "@/lib/hours";

type UrenPersoon = {
    name: string | null;
    email: string;
};

export type ProjectUrenAfdrukRow = {
    id: string;
    datum: string;
    uren: number;
    omschrijving: string | null;
    kilometers: number | null;
    createdAt: string;
    user: UrenPersoon;
    bookedBy: UrenPersoon | null;
};

export type ProjectUrenAfdrukMonteur = {
    naam: string;
    totaal: number;
    regels: number;
    km: number;
};

function persoonLabel(user: UrenPersoon): string {
    return user.name?.trim() || user.email;
}

function formatDatum(value: string): string {
    return new Date(value).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatDatumTijd(value: string): string {
    return new Date(value).toLocaleString("nl-NL", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatKm(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) {
        return "—";
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatUren(value: number): string {
    return formatHoursDisplay(value) || "0";
}

export default function ProjectUrenAfdruk({
    number,
    name,
    customerName,
    location,
    plaats,
    uren,
    perMonteur,
    totaalUren,
}: {
    number: string;
    name: string;
    customerName: string;
    location: string | null;
    plaats: string | null;
    uren: ProjectUrenAfdrukRow[];
    perMonteur: ProjectUrenAfdrukMonteur[];
    totaalUren: number;
}) {
    if (uren.length === 0) {
        return null;
    }

    const adres = [location, plaats].filter(Boolean).join(", ");
    const totaalKm = perMonteur.reduce((sum, row) => sum + row.km, 0);
    const gedruktOp = new Date().toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="hidden print:block text-gray-900">
            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 12mm;
                    }
                }
            `}</style>

            <header className="border-b-2 border-[#0066FF] pb-3 mb-4">
                <p className="text-xs font-semibold tracking-wide text-[#0066FF]">
                    MDB Networks
                </p>
                <h1 className="text-xl font-bold mt-0.5">Urenoverzicht</h1>
                <p className="text-sm text-gray-700 mt-1">
                    {number} · {name}
                </p>
                <dl className="mt-2 grid grid-cols-3 gap-x-6 gap-y-1 text-xs">
                    <div>
                        <dt className="text-gray-500">Opdrachtgever</dt>
                        <dd className="font-medium">{customerName}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Locatie</dt>
                        <dd className="font-medium">{adres || "—"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Afgedrukt</dt>
                        <dd className="font-medium">{gedruktOp}</dd>
                    </div>
                </dl>
            </header>

            <section className="mb-4">
                <h2 className="text-sm font-semibold mb-2">
                    Overzicht per monteur
                </h2>
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="text-left border-b border-gray-300">
                            <th className="py-1.5 pr-3 font-semibold">
                                Monteur
                            </th>
                            <th className="py-1.5 pr-3 font-semibold">
                                Uren
                            </th>
                            <th className="py-1.5 pr-3 font-semibold">Km</th>
                            <th className="py-1.5 font-semibold">Regels</th>
                        </tr>
                    </thead>
                    <tbody>
                        {perMonteur.map((row) => (
                            <tr
                                key={row.naam}
                                className="border-b border-gray-200"
                            >
                                <td className="py-1.5 pr-3">{row.naam}</td>
                                <td className="py-1.5 pr-3">
                                    {formatUren(row.totaal)}
                                </td>
                                <td className="py-1.5 pr-3">
                                    {row.km > 0 ? formatKm(row.km) : "—"}
                                </td>
                                <td className="py-1.5">{row.regels}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-semibold">
                            <td className="py-1.5 pr-3">Totaal</td>
                            <td className="py-1.5 pr-3">
                                {formatUren(totaalUren)}
                            </td>
                            <td className="py-1.5 pr-3">
                                {totaalKm > 0 ? formatKm(totaalKm) : "—"}
                            </td>
                            <td className="py-1.5">{uren.length}</td>
                        </tr>
                    </tfoot>
                </table>
                <p className="text-[11px] text-gray-500 mt-2">
                    Km zijn alleen van deze projectlocatie (zaak ↔ project),
                    niet de hele dagroute.
                </p>
            </section>

            <section>
                <h2 className="text-sm font-semibold mb-2">Geboekte uren</h2>
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="text-left border-b border-gray-300">
                            <th className="py-1.5 pr-3 font-semibold">
                                Datum
                            </th>
                            <th className="py-1.5 pr-3 font-semibold">
                                Monteur
                            </th>
                            <th className="py-1.5 pr-3 font-semibold">
                                Uren
                            </th>
                            <th className="py-1.5 pr-3 font-semibold">Km</th>
                            <th className="py-1.5 pr-3 font-semibold">
                                Geboekt door
                            </th>
                            <th className="py-1.5 pr-3 font-semibold">
                                Geboekt op
                            </th>
                            <th className="py-1.5 font-semibold">
                                Omschrijving
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {uren.map((row) => {
                            const geboektDoor = row.bookedBy
                                ? persoonLabel(row.bookedBy)
                                : persoonLabel(row.user);

                            return (
                                <tr
                                    key={row.id}
                                    className="border-b border-gray-200 align-top"
                                >
                                    <td className="py-1.5 pr-3 whitespace-nowrap">
                                        {formatDatum(row.datum)}
                                    </td>
                                    <td className="py-1.5 pr-3">
                                        {persoonLabel(row.user)}
                                    </td>
                                    <td className="py-1.5 pr-3">
                                        {formatUren(row.uren)}
                                    </td>
                                    <td className="py-1.5 pr-3">
                                        {formatKm(row.kilometers)}
                                    </td>
                                    <td className="py-1.5 pr-3">
                                        {geboektDoor}
                                    </td>
                                    <td className="py-1.5 pr-3 whitespace-nowrap">
                                        {row.createdAt
                                            ? formatDatumTijd(row.createdAt)
                                            : "—"}
                                    </td>
                                    <td className="py-1.5">
                                        {row.omschrijving || "—"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>
        </div>
    );
}
