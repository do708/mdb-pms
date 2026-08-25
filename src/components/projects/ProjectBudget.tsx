"use client";

import {
    budgetSignal,
    PROJECT_UUR_TARIEF,
    projectEindbedrag,
    projectEindbedragSignal,
    projectUrenKosten,
    signalClasses,
    type BudgetSignal,
} from "@/lib/projects/budget";

export function BudgetBadge({
    gebruikt,
    geoffreerd,
    eenheid,
}: {
    gebruikt: number;
    geoffreerd: number | null;
    eenheid: string;
}) {
    const signal = budgetSignal(gebruikt, geoffreerd);
    const label = signalLabel(signal);

    return (
        <span
            className={`
                inline-flex
                items-center
                gap-1
                px-2.5
                py-1
                rounded-lg
                text-xs
                font-semibold
                border
                ${signalClasses(signal)}
            `}
        >
            {label}
            {geoffreerd != null && geoffreerd > 0 ? (
                <span className="font-normal opacity-90">
                    ({gebruikt.toFixed(1)} / {geoffreerd} {eenheid})
                </span>
            ) : null}
        </span>
    );
}

function signalLabel(signal: BudgetSignal): string {
    switch (signal) {
        case "groen":
            return "Binnen budget";
        case "oranje":
            return "Bijna vol";
        case "rood":
            return "Over budget";
        default:
            return "Geen budget";
    }
}

export function ProgressBar({
    gebruikt,
    geoffreerd,
    label,
}: {
    gebruikt: number;
    geoffreerd: number | null;
    label: string;
}) {
    const pct =
        geoffreerd != null && geoffreerd > 0
            ? Math.min(100, (gebruikt / geoffreerd) * 100)
            : 0;

    const signal = budgetSignal(gebruikt, geoffreerd);

    let barColor = "bg-gray-300";

    if (signal === "groen") {
        barColor = "bg-emerald-500";
    } else if (signal === "oranje") {
        barColor = "bg-amber-500";
    } else if (signal === "rood") {
        barColor = "bg-red-500";
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium">
                    {gebruikt.toFixed(1)}
                    {geoffreerd != null && geoffreerd > 0
                        ? ` / ${geoffreerd}`
                        : ""}
                </span>
            </div>

            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} transition-all`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function formatEuro(value: number): string {
    return new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR",
    }).format(value);
}

export function ProjectResultaatTotaal({
    uren,
    materiaal,
    offerte,
}: {
    uren: number;
    materiaal: number;
    offerte: number;
}) {
    const urenKosten = projectUrenKosten(uren);
    const heeftOfferte = offerte > 0;
    const eindbedrag = projectEindbedrag(uren, materiaal, offerte);
    const signal = projectEindbedragSignal(eindbedrag, heeftOfferte);
    const label =
        signal === "rood"
            ? "Over budget"
            : signal === "groen"
              ? "Binnen budget"
              : "Geen offertebedrag";

    return (
        <div className="space-y-3">
            <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">
                        {uren.toFixed(1)} uur × {formatEuro(PROJECT_UUR_TARIEF)}
                    </dt>
                    <dd className="font-medium">{formatEuro(urenKosten)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Materiaalkosten</dt>
                    <dd className="font-medium">{formatEuro(materiaal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Offertebedrag</dt>
                    <dd className="font-medium">
                        {heeftOfferte ? `− ${formatEuro(offerte)}` : "—"}
                    </dd>
                </div>
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <span className="text-sm font-semibold text-gray-800">
                    Eindbedrag
                </span>
                <span className="flex items-center gap-2">
                    <span
                        className={`
                            text-lg font-bold
                            ${
                                signal === "rood"
                                    ? "text-red-600"
                                    : signal === "groen"
                                      ? "text-emerald-600"
                                      : "text-gray-700"
                            }
                        `}
                    >
                        {heeftOfferte ? formatEuro(eindbedrag) : "—"}
                    </span>
                    <span
                        className={`
                            inline-flex items-center px-2.5 py-1
                            rounded-lg text-xs font-semibold border
                            ${signalClasses(signal)}
                        `}
                    >
                        {label}
                    </span>
                </span>
            </div>
        </div>
    );
}
