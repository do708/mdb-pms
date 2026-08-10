// Wanneer telt een werkbon/formulier als "gearchiveerd"?
// Opdrachten: status gefactureerd → direct uit de
// gewone overzichten, alleen nog via het Archief te vinden.
// Formulieren: ouder dan ARCHIVE_WEEKS.

export const ARCHIVE_WEEKS = 2;

/** Statussen waarmee een werkbon in het archief hoort. */
export const ARCHIVED_WORKORDER_STATUSES = [
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
