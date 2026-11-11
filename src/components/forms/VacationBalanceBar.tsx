"use client";

import {
    budgetSignal,
    signalClasses,
} from "@/lib/projects/budget";
import type { VacationBalance } from "@/lib/reports/vacation";

export default function VacationBalanceBar({
    balance,
    thisRequestDays,
    showThisRequestPending = false,
}: {
    balance: VacationBalance;
    thisRequestDays?: number;
    showThisRequestPending?: boolean;
}) {
    const pct =
        balance.entitled > 0
            ? Math.min(100, (balance.used / balance.entitled) * 100)
            : 0;
    const signal = budgetSignal(balance.used, balance.entitled);

    let barColor = "bg-gray-300";
    if (signal === "groen") {
        barColor = "bg-emerald-500";
    } else if (signal === "oranje") {
        barColor = "bg-amber-500";
    } else if (signal === "rood") {
        barColor = "bg-red-500";
    }

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between gap-2 text-sm">
                <span className="text-gray-600">
                    Vakantiedagen {balance.year}
                </span>
                <span className="font-medium text-gray-900">
                    {balance.used} / {balance.entitled}
                </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} transition-all`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={`
                        inline-flex items-center px-2 py-0.5 rounded-lg
                        text-xs font-semibold border
                        ${signalClasses(signal)}
                    `}
                >
                    {balance.remaining} over
                </span>
                {balance.pending > 0 ? (
                    <span className="text-xs text-gray-500">
                        {balance.pending} aangevraagd, nog niet goedgekeurd
                    </span>
                ) : null}
            </div>
            {thisRequestDays != null ? (
                <p className="text-xs text-gray-500">
                    Deze aanvraag: {thisRequestDays} werkdag
                    {thisRequestDays === 1 ? "" : "en"}
                    {" "}
                    (weekend en feestdagen tellen niet mee)
                    {showThisRequestPending
                        ? " — wordt afgeboekt na goedkeuring door kantoor"
                        : ""}
                </p>
            ) : null}
        </div>
    );
}
