const PREFIX = "mdb-oplever-draft:";

export type OpleverDraft = {
    savedAt: number;
    formData: unknown;
};

function keyFor(workorderId: string): string {
    return `${PREFIX}${workorderId}`;
}

export function readOpleverDraft(workorderId: string): OpleverDraft | null {
    if (typeof window === "undefined" || !workorderId) {
        return null;
    }

    try {
        const raw = localStorage.getItem(keyFor(workorderId));
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as OpleverDraft;
        if (!parsed || typeof parsed !== "object" || !parsed.formData) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function writeOpleverDraft(
    workorderId: string,
    formData: unknown
): void {
    if (typeof window === "undefined" || !workorderId || formData == null) {
        return;
    }

    try {
        localStorage.setItem(
            keyFor(workorderId),
            JSON.stringify({
                savedAt: Date.now(),
                formData,
            } satisfies OpleverDraft)
        );
    } catch (error) {
        console.warn("OPLEVER DRAFT SAVE", error);
    }
}

export function clearOpleverDraft(workorderId: string): void {
    if (typeof window === "undefined" || !workorderId) {
        return;
    }

    try {
        localStorage.removeItem(keyFor(workorderId));
    } catch {
        // ignore
    }
}
