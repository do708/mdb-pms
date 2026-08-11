import {
    Banknote,
    CalendarCheck,
    Check,
    Clock3,
    Mail,
    Pause,
} from "lucide-react";

import { getStatus, migrateStatus } from "@/constants/workorderStatus";

/** Kernstatussen met icoon (overzicht + planning). */
export const WORKORDER_STATUS_ICON_LEGEND = [
    { key: "ontvangen", shortLabel: "Opdracht ontvangen" },
    { key: "afspraak", shortLabel: "Afspraak verstuurd" },
    { key: "ingepland", shortLabel: "Ingepland" },
    { key: "uitgevoerd", shortLabel: "Uitgevoerd" },
    { key: "gefactureerd", shortLabel: "Gefactureerd" },
] as const;

function iconForStatus(key: string) {
    switch (key) {
        case "afspraak":
            return Mail;
        case "ingepland":
            return CalendarCheck;
        case "uitgevoerd":
            return Check;
        case "gefactureerd":
            return Banknote;
        case "on_hold":
            return Pause;
        case "ontvangen":
        default:
            return Clock3;
    }
}

/** Statusicoon voor planning en opdrachten-overzicht. */
export function PlanningStatusIcon({
    status,
    className = "h-3.5 w-3.5",
}: {
    status: string | null | undefined;
    className?: string;
}) {
    const key = migrateStatus(status);
    const label = getStatus(key).label;
    const Icon = iconForStatus(key);

    return (
        <span
            title={label}
            aria-label={label}
            className="inline-flex shrink-0 opacity-95"
        >
            <Icon className={className} strokeWidth={2.5} />
        </span>
    );
}

/** Compacte legenda: statusiconen op planning/opdrachten. */
export function WorkorderStatusIconLegend({
    className = "",
}: {
    className?: string;
}) {
    return (
        <div
            className={`
                flex flex-wrap items-center gap-x-4 gap-y-1.5
                text-xs text-slate-600
                ${className}
            `}
        >
            {WORKORDER_STATUS_ICON_LEGEND.map((item) => (
                <span
                    key={item.key}
                    className="inline-flex items-center gap-1.5"
                    title={getStatus(item.key).label}
                >
                    <PlanningStatusIcon
                        status={item.key}
                        className="h-3.5 w-3.5 text-slate-700"
                    />
                    <span>{item.shortLabel}</span>
                </span>
            ))}
        </div>
    );
}
