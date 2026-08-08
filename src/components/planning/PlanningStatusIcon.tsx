import {
    Banknote,
    Check,
    CircleCheck,
    Clock3,
} from "lucide-react";

import { getStatus, migrateStatus } from "@/constants/workorderStatus";

/** Statusicoon voor geplande werkbonnen in week-/maandoverzicht. */
export function PlanningStatusIcon({
    status,
    className = "h-3 w-3",
}: {
    status: string | null | undefined;
    className?: string;
}) {
    const key = migrateStatus(status);
    const label = getStatus(key).label;

    let Icon = Clock3;

    if (key === "ingepland") {
        Icon = Check;
    } else if (key === "uitgevoerd") {
        Icon = CircleCheck;
    } else if (key === "gefactureerd" || key === "afgerond") {
        Icon = Banknote;
    } else if (key === "afspraak") {
        Icon = Clock3;
    }

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
