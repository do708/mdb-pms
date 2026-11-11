"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import VacationBalanceBar from "@/components/forms/VacationBalanceBar";
import {
    SpecFieldLabel,
    SpecPanel,
    specSelectClassName,
} from "@/components/ui/SpecLayout";
import type { VacationBalance } from "@/lib/reports/vacation";

type TeamResponse = {
    year: number;
    entitledBase: number;
    years: number[];
    balances: VacationBalance[];
};

export default function VacationTeamOverview() {
    const { data: session, status } = useSession();
    const role = session?.user?.role;
    const canSee =
        role === "admin" || role === "office";

    const [year, setYear] = useState(() => new Date().getFullYear());
    const [data, setData] = useState<TeamResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status !== "authenticated" || !canSee) {
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError("");

        async function load() {
            const response = await fetch(
                `/api/forms/vacation/team?year=${year}`
            );
            if (cancelled) {
                return;
            }
            if (!response.ok) {
                setError(
                    response.status === 403
                        ? ""
                        : "Vakantieoverzicht laden mislukt."
                );
                setData(null);
                setLoading(false);
                return;
            }
            const json = (await response.json()) as TeamResponse;
            setData(json);
            setLoading(false);
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [status, canSee, year]);

    if (status !== "authenticated" || !canSee) {
        return null;
    }

    const yearOptions = data?.years?.length
        ? data.years
        : [year];

    return (
        <SpecPanel
            title={`Vakantiedagen ${data?.year ?? year}`}
            hint="Alleen eigen monteurs en office. 31 dagen per jaar; restant gaat mee. Aftrek pas na goedkeuring."
            actions={
                <label className="block min-w-[7rem]">
                    <SpecFieldLabel>Jaar</SpecFieldLabel>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className={specSelectClassName}
                    >
                        {yearOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>
            }
        >
            {loading && (
                <p className="text-sm text-gray-500">Laden...</p>
            )}
            {error ? (
                <p className="text-sm text-amber-800">{error}</p>
            ) : null}
            {!loading && data && data.balances.length === 0 ? (
                <p className="text-sm text-gray-500">
                    Geen eigen monteurs of office-medewerkers.
                </p>
            ) : null}
            {!loading && data && data.balances.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                    {data.balances.map((balance) => (
                        <div
                            key={balance.userId}
                            className="rounded-xl border border-gray-100 p-3 space-y-2"
                        >
                            <p className="text-sm font-medium text-gray-900">
                                {balance.name}
                            </p>
                            <VacationBalanceBar balance={balance} />
                        </div>
                    ))}
                </div>
            ) : null}
        </SpecPanel>
    );
}
