"use client";

import { useEffect, useMemo, useState } from "react";

import { formatClockHours } from "@/types/oplever";
import {
    countsTowardKilometers,
    parseStaffKind,
    STAFF_KIND_LABELS,
} from "@/constants/staffKind";
import {
    PageHeader,
    PageShell,
    SpecFieldLabel,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
    SpecStat,
    specSelectClassName,
} from "@/components/ui/SpecLayout";
import {
    availableYears,
    customersTotals,
    engineersFromSources,
    engineersTotalsWithLeave,
    filterTimeline,
    groupTimeline,
    MONTH_FILTER_OPTIONS,
    periodRange,
    periodStatLabel,
    timelineTotals,
    type GroupBy,
    type PeriodPreset,
    type ReportDayRow,
    type ReportLeaveRange,
} from "@/lib/reports/periods";

interface ReportData {
    totals: {
        workorders: number;
        hoursTotal: number;
        hoursThisMonth: number;
        kilometersThisMonth: number;
    };
    byStatus: Record<string, number>;
    byDay?: ReportDayRow[];
    leave?: ReportLeaveRange[];
}

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
    { value: "day", label: "Vandaag" },
    { value: "week", label: "Deze week" },
    { value: "month", label: "Deze maand" },
    { value: "year", label: "Jaar / maand" },
    { value: "custom", label: "Kies maand" },
    { value: "all", label: "Alles" },
];

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
    { value: "day", label: "Per dag" },
    { value: "week", label: "Per week" },
    { value: "month", label: "Per maand" },
];

function formatKm(value: number): string {
    const rounded = Math.round(value);
    return String(rounded);
}

function staffKindNote(staffKind?: string): string | null {
    const kind = parseStaffKind(staffKind);
    if (kind === "monteur") {
        return null;
    }
    return STAFF_KIND_LABELS[kind];
}

function formatTravelCell(value: number, staffKind?: string): string {
    if (!countsTowardKilometers(staffKind)) {
        return "—";
    }
    return formatClockHours(value) || "0";
}

function formatKmCell(value: number, staffKind?: string): string {
    if (!countsTowardKilometers(staffKind)) {
        return "—";
    }
    return formatKm(value);
}

function currentMonthInput(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [engineerFilter, setEngineerFilter] = useState("alle");
    const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("month");
    const [customMonth, setCustomMonth] = useState(currentMonthInput);
    const [selectedYear, setSelectedYear] = useState(
        () => new Date().getFullYear()
    );
    const [selectedYearMonth, setSelectedYearMonth] = useState("");
    const [groupBy, setGroupBy] = useState<GroupBy>("day");

    useEffect(() => {
        async function load() {
            const response = await fetch("/api/reports");

            if (!response.ok) {
                setError(
                    response.status === 403
                        ? "Rapportages zijn alleen beschikbaar voor kantoor en admin."
                        : "Rapportage ophalen mislukt."
                );
                setLoading(false);
                return;
            }

            setData(await response.json());
            setLoading(false);
        }

        load();
    }, []);

    const leave = data?.leave ?? [];

    const yearFilter = useMemo(
        () => ({ year: selectedYear, month: selectedYearMonth }),
        [selectedYear, selectedYearMonth]
    );

    const range = useMemo(
        () => periodRange(periodPreset, customMonth, yearFilter),
        [periodPreset, customMonth, yearFilter]
    );

    const timeline = data?.byDay ?? [];

    const yearOptions = useMemo(() => {
        const years = availableYears(timeline, leave);
        if (!years.includes(selectedYear)) {
            return [selectedYear, ...years].sort((a, b) => b - a);
        }
        return years;
    }, [timeline, leave, selectedYear]);

    const engineerOptions = useMemo(
        () => engineersFromSources(timeline, leave),
        [timeline, leave]
    );

    const filtered = useMemo(
        () => filterTimeline(timeline, engineerFilter, range),
        [timeline, engineerFilter, range]
    );

    const totals = useMemo(() => timelineTotals(filtered), [filtered]);
    const grouped = useMemo(
        () => groupTimeline(filtered, groupBy),
        [filtered, groupBy]
    );
    const perMonteur = useMemo(
        () =>
            engineersTotalsWithLeave(
                filtered,
                leave,
                engineerFilter,
                range
            ),
        [filtered, leave, engineerFilter, range]
    );
    const leaveDaysTotal = useMemo(
        () => perMonteur.reduce((sum, row) => sum + row.leaveDays, 0),
        [perMonteur]
    );
    const perKlant = useMemo(
        () => customersTotals(filtered),
        [filtered]
    );

    if (loading) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Rapportages laden...</p>
            </PageShell>
        );
    }

    if (error || !data) {
        return (
            <PageShell>
                <SpecPanel tone="amber">
                    <p className="text-sm text-gray-800">
                        {error || "Geen data beschikbaar."}
                    </p>
                </SpecPanel>
            </PageShell>
        );
    }

    const groupTitle =
        groupBy === "day"
            ? "Overzicht per dag"
            : groupBy === "week"
              ? "Overzicht per week"
              : "Overzicht per maand";

    return (
        <PageShell>
            <PageHeader title="Rapportages" />

            <SpecPageCard>
                <SpecPanel
                    title="Filters"
                    hint="Uren komen uit de planning (niet uit de werkbon). Kilometers en reistijd alleen voor eigen monteurs; inleners en stagiairs staan wel in het urenoverzicht. Kilometers zijn werkelijk gereden (dagroute). Verlof telt werkdagen (ma–vr) van geaccepteerde aanvragen."
                >
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <label className="block">
                            <SpecFieldLabel>Monteur</SpecFieldLabel>
                            <select
                                value={engineerFilter}
                                onChange={(e) =>
                                    setEngineerFilter(e.target.value)
                                }
                                className={specSelectClassName}
                            >
                                <option value="alle">Alle monteurs</option>
                                {engineerOptions.map((engineer) => (
                                    <option
                                        key={engineer.id || engineer.name}
                                        value={engineer.id}
                                    >
                                        {engineer.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <SpecFieldLabel>Periode</SpecFieldLabel>
                            <select
                                value={periodPreset}
                                onChange={(e) =>
                                    setPeriodPreset(
                                        e.target.value as PeriodPreset
                                    )
                                }
                                className={specSelectClassName}
                            >
                                {PERIOD_OPTIONS.map((optie) => (
                                    <option
                                        key={optie.value}
                                        value={optie.value}
                                    >
                                        {optie.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {periodPreset === "year" ? (
                            <>
                                <label className="block">
                                    <SpecFieldLabel>Jaar</SpecFieldLabel>
                                    <select
                                        value={String(selectedYear)}
                                        onChange={(e) =>
                                            setSelectedYear(
                                                Number(e.target.value)
                                            )
                                        }
                                        className={specSelectClassName}
                                    >
                                        {yearOptions.map((year) => (
                                            <option
                                                key={year}
                                                value={year}
                                            >
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <SpecFieldLabel>Maand</SpecFieldLabel>
                                    <select
                                        value={selectedYearMonth}
                                        onChange={(e) =>
                                            setSelectedYearMonth(
                                                e.target.value
                                            )
                                        }
                                        className={specSelectClassName}
                                    >
                                        {MONTH_FILTER_OPTIONS.map((optie) => (
                                            <option
                                                key={optie.value || "jaar"}
                                                value={optie.value}
                                            >
                                                {optie.value
                                                    ? `${optie.label} ${selectedYear}`
                                                    : `Hele jaar ${selectedYear}`}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </>
                        ) : null}

                        {periodPreset === "custom" ? (
                            <label className="block">
                                <SpecFieldLabel>Maand</SpecFieldLabel>
                                <input
                                    type="month"
                                    value={customMonth}
                                    onChange={(e) =>
                                        setCustomMonth(e.target.value)
                                    }
                                    className={specSelectClassName}
                                />
                            </label>
                        ) : null}

                        <label className="block">
                            <SpecFieldLabel>Totalen tonen</SpecFieldLabel>
                            <select
                                value={groupBy}
                                onChange={(e) =>
                                    setGroupBy(e.target.value as GroupBy)
                                }
                                className={specSelectClassName}
                            >
                                {GROUP_OPTIONS.map((optie) => (
                                    <option
                                        key={optie.value}
                                        value={optie.value}
                                    >
                                        {optie.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </SpecPanel>
            </SpecPageCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <SpecStat
                    label="Opdrachten totaal"
                    value={data.totals.workorders}
                />
                <SpecStat
                    label={periodStatLabel(
                        "Uren",
                        periodPreset,
                        customMonth,
                        yearFilter
                    )}
                    value={formatClockHours(totals.hours) || "0"}
                />
                <SpecStat
                    label={periodStatLabel(
                        "Reistijd",
                        periodPreset,
                        customMonth,
                        yearFilter
                    )}
                    value={formatClockHours(totals.travel) || "0"}
                />
                <SpecStat
                    label={periodStatLabel(
                        "Kilometers",
                        periodPreset,
                        customMonth,
                        yearFilter
                    )}
                    value={formatKm(totals.kilometers)}
                />
                <SpecStat
                    label={periodStatLabel(
                        "Verlof",
                        periodPreset,
                        customMonth,
                        yearFilter
                    )}
                    value={leaveDaysTotal}
                />
            </div>

            <SpecPageCard>
                <SpecPanel title={groupTitle}>
                    {grouped.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Geen uren of kilometers in deze selectie.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-gray-200">
                                        <th className="py-2 text-xs font-medium text-gray-500">
                                            {groupBy === "day"
                                                ? "Dag"
                                                : groupBy === "week"
                                                  ? "Week"
                                                  : "Maand"}
                                        </th>
                                        <th className="py-2 text-right text-xs font-medium text-gray-500">
                                            Uren
                                        </th>
                                        <th className="py-2 text-right text-xs font-medium text-gray-500">
                                            Reistijd
                                        </th>
                                        <th className="py-2 text-right text-xs font-medium text-gray-500">
                                            Kilometers
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grouped.map((row) => (
                                        <tr
                                            key={row.key}
                                            className="border-b border-gray-100"
                                        >
                                            <td className="py-2 text-gray-900">
                                                {row.label}
                                            </td>
                                            <td className="py-2 text-right text-gray-900">
                                                {formatClockHours(row.hours) ||
                                                    "0"}
                                            </td>
                                            <td className="py-2 text-right text-gray-900">
                                                {formatClockHours(row.travel) ||
                                                    "0"}
                                            </td>
                                            <td className="py-2 text-right text-gray-900">
                                                {formatKm(row.kilometers)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-semibold">
                                        <td className="py-2">Totaal</td>
                                        <td className="py-2 text-right">
                                            {formatClockHours(totals.hours) ||
                                                "0"}
                                        </td>
                                        <td className="py-2 text-right">
                                            {formatClockHours(totals.travel) ||
                                                "0"}
                                        </td>
                                        <td className="py-2 text-right">
                                            {formatKm(totals.kilometers)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </SpecPanel>

                <SpecPanel title="Opdrachten per status" tone="slate">
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(data.byStatus).map(
                            ([status, count]) => (
                                <div
                                    key={status}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                >
                                    <span className="text-xs text-gray-500 mr-2">
                                        {status}
                                    </span>
                                    <strong className="text-gray-900">
                                        {count}
                                    </strong>
                                </div>
                            )
                        )}
                    </div>
                </SpecPanel>

                <SpecPanel title="Uren per monteur">
                    {perMonteur.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Nog geen uren, kilometers of verlof in deze
                            selectie.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-gray-200">
                                        <th className="py-2 text-xs font-medium text-gray-500">
                                            Monteur
                                        </th>
                                        <th className="py-2 text-right text-xs font-medium text-gray-500">
                                            Uren
                                        </th>
                                        <th className="py-2 text-right text-xs font-medium text-gray-500">
                                            Reistijd
                                        </th>
                                        <th className="py-2 text-right text-xs font-medium text-gray-500">
                                            Kilometers
                                        </th>
                                        <th className="py-2 text-right text-xs font-medium text-gray-500">
                                            Verlofdagen
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {perMonteur.map((engineer) => (
                                        <tr
                                            key={engineer.id || engineer.name}
                                            className="border-b border-gray-100"
                                        >
                                            <td className="py-2 text-gray-900">
                                                {engineer.name}
                                                {staffKindNote(
                                                    engineer.staffKind
                                                ) ? (
                                                    <span className="block text-xs text-gray-500">
                                                        {staffKindNote(
                                                            engineer.staffKind
                                                        )}
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="py-2 text-right text-gray-900">
                                                {formatClockHours(
                                                    engineer.hours
                                                ) || "0"}
                                            </td>
                                            <td className="py-2 text-right text-gray-900">
                                                {formatTravelCell(
                                                    engineer.travel,
                                                    engineer.staffKind
                                                )}
                                            </td>
                                            <td className="py-2 text-right text-gray-900">
                                                {formatKmCell(
                                                    engineer.kilometers,
                                                    engineer.staffKind
                                                )}
                                            </td>
                                            <td className="py-2 text-right text-gray-900">
                                                {engineer.leaveDays}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SpecPanel>

                <SpecPanel title="Uren per klant">
                    {perKlant.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Nog geen uren in deze selectie.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {perKlant.map((customer) => (
                                <SpecListRow
                                    key={customer.id || customer.name}
                                    className="flex justify-between items-center gap-3"
                                >
                                    <span className="text-sm text-gray-900">
                                        {customer.name}
                                    </span>
                                    <strong className="text-sm text-gray-900">
                                        {formatClockHours(customer.hours) ||
                                            "0"}{" "}
                                        uur
                                    </strong>
                                </SpecListRow>
                            ))}
                        </div>
                    )}
                </SpecPanel>
            </SpecPageCard>
        </PageShell>
    );
}
