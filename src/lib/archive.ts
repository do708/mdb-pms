// Wanneer telt een werkbon/formulier als "gearchiveerd"?
// Office/admin: status gefactureerd → uit de gewone overzichten.
// Monteurs: uitgevoerd (ingevulde werkbon) óf gefactureerd → Archief.
// Formulieren: ouder dan ARCHIVE_WEEKS.

export const ARCHIVE_WEEKS = 2;

/** Statussen waarmee een werkbon in het archief hoort (office/admin). */
export const ARCHIVED_WORKORDER_STATUSES = [
    "gefactureerd",
] as const;

/**
 * Voor monteurs: ingevulde werkbonnen (uitgevoerd) staan in Archief.
 * Gefactureerd blijft ook in Archief.
 */
export const ENGINEER_ARCHIVED_WORKORDER_STATUSES = [
    "uitgevoerd",
    "gefactureerd",
] as const;


export function archiveCutoff(): Date {
    const cutoff = new Date();

    cutoff.setDate(cutoff.getDate() - ARCHIVE_WEEKS * 7);

    return cutoff;
}

export function isArchivedWorkorderStatus(
    status: string | null | undefined
): boolean {
    if (!status) {
        return false;
    }

    return (ARCHIVED_WORKORDER_STATUSES as readonly string[]).includes(
        status
    );
}

// Prisma-where die gearchiveerde opdrachten UITSLUIT (voor gewone lijsten).
export function excludeArchivedWorkorders() {
    return {
        NOT: {
            status: {
                in: [...ARCHIVED_WORKORDER_STATUSES],
            },
        },
    };
}

// Prisma-where die ALLEEN de gearchiveerde opdrachten teruggeeft.
export function onlyArchivedWorkorders() {
    return {
        status: {
            in: [...ARCHIVED_WORKORDER_STATUSES],
        },
    };
}

export function onlyEngineerArchivedWorkorders() {
    return {
        status: {
            in: [...ENGINEER_ARCHIVED_WORKORDER_STATUSES],
        },
    };
}

/** Toegewezen als hoofdmonteur of extra monteur (zelfde als planning). */
export function assignedToEngineer(userId: string) {
    return {
        OR: [
            { assignedUserId: userId },
            {
                extraEngineers: {
                    some: { userId },
                },
            },
        ],
    };
}

// Formulieren: "afgerond" bestaat niet als status; we archiveren op
// ouderdom van ingediende formulieren.
export function excludeArchivedForms() {
    return {
        NOT: {
            createdAt: {
                lt: archiveCutoff(),
            },
        },
    };
}

export function onlyArchivedForms() {
    return {
        createdAt: {
            lt: archiveCutoff(),
        },
    };
}
