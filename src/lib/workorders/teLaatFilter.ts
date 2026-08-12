import { migrateStatus } from "@/constants/workorderStatus";

const NOG_IN_TE_VULLEN = ["ontvangen", "afspraak", "ingepland"] as const;

export function isTeLaatInvullen(workorder: {
    plannedDate: string | null;
    status: string;
}): boolean {
    if (!workorder.plannedDate) {
        return false;
    }

    const startVandaag = new Date();
    startVandaag.setHours(0, 0, 0, 0);

    const planned = new Date(workorder.plannedDate);

    if (isNaN(planned.getTime()) || planned >= startVandaag) {
        return false;
    }

    return NOG_IN_TE_VULLEN.includes(
        migrateStatus(workorder.status) as (typeof NOG_IN_TE_VULLEN)[number]
    );
}
