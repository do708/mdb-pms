/**
 * Automatische km/reistijd is uitgeschakeld (onbetrouwbaar).
 * Deze functie wist nog openstaande auto-waarden voor die monteur/dag.
 */
export async function syncEngineerDayKilometers(
    engineerId: string | null | undefined,
    plannedDate: Date | null | undefined
): Promise<void> {
    // Bewust geen OSRM/Nominatim meer. Callers mogen blijven bestaan
    // zonder side-effects; eventuele opschoning gebeurt via clearAutoKilometers.
    void engineerId;
    void plannedDate;
}

export async function clearAllAutoKilometers(): Promise<{
    workorders: number;
    projectUren: number;
}> {
    const { prisma } = await import("@/lib/prisma");

    const [workorders, projectUren] = await Promise.all([
        prisma.workorder.updateMany({
            where: {
                OR: [
                    { plannedRoundTripKm: { not: null } },
                    { plannedReisuren: { not: null } },
                ],
            },
            data: {
                plannedRoundTripKm: null,
                plannedReisuren: null,
            },
        }),
        prisma.projectUur.updateMany({
            where: {
                kilometers: { not: null },
            },
            data: {
                kilometers: null,
            },
        }),
    ]);

    return {
        workorders: workorders.count,
        projectUren: projectUren.count,
    };
}
