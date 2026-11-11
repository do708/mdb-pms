export type JobCrewPerson = {
    id: string;
    name: string;
};

export function jobCrewMembers(item: {
    assignedUser?: { id?: string | null; name?: string | null } | null;
    extraEngineers?: Array<{
        user?: { id?: string | null; name?: string | null } | null;
    } | null> | null;
}): JobCrewPerson[] {
    const people: JobCrewPerson[] = [];
    const seen = new Set<string>();

    const add = (id?: string | null, name?: string | null) => {
        const trimmed = (name || "").trim();
        if (!id || !trimmed || seen.has(id)) {
            return;
        }
        seen.add(id);
        people.push({ id, name: trimmed });
    };

    add(item.assignedUser?.id, item.assignedUser?.name);
    for (const extra of item.extraEngineers || []) {
        add(extra?.user?.id, extra?.user?.name);
    }

    return people;
}

function voornaam(name: string): string {
    return name.trim().split(/\s+/)[0] || name;
}

/** Regel voor op de planningkaart: Alleen, of Samen met … */
export function jobCrewLine(
    item: Parameters<typeof jobCrewMembers>[0],
    viewerId?: string | null,
    compact = false
): { solo: boolean; text: string } {
    const people = jobCrewMembers(item);

    if (people.length <= 1) {
        return { solo: true, text: "Alleen" };
    }

    const others = people.filter((person) => person.id !== viewerId);
    const names = (others.length > 0 ? others : people).map((person) =>
        compact ? voornaam(person.name) : person.name
    );

    return {
        solo: false,
        text: `Samen met ${names.join(", ")}`,
    };
}
