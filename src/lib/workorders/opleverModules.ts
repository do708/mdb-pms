export const OPLEVER_MODULE_KEYS = [
    "uren",
    "kilometers",
    "schermen_montage",
    "schermen_hermontage",
    "schermen_demontage",
    "videowall_montage",
    "videowall_hermontage",
    "videowall_demontage",
    "kiosk_montage",
    "kiosk_hermontage",
    "kiosk_demontage",
    "mediaplayers_montage",
    "mediaplayers_hermontage",
    "mediaplayers_demontage",
    "audio_montage",
    "audio_hermontage",
    "audio_demontage",
    "project",
    "extra_kosten",
] as const;

export type OpleverModule = (typeof OPLEVER_MODULE_KEYS)[number];

export const OPLEVER_MODULE_GROEPEN: {
    titel: string;
    items: { key: OpleverModule; label: string }[];
}[] = [
    {
        titel: "Tijd",
        items: [
            { key: "uren", label: "Uren" },
            { key: "kilometers", label: "Kilometers" },
        ],
    },
    {
        titel: "Schermen",
        items: [
            { key: "schermen_montage", label: "Montage" },
            { key: "schermen_hermontage", label: "Hermontage" },
            { key: "schermen_demontage", label: "Demontage" },
        ],
    },
    {
        titel: "Videowall",
        items: [
            { key: "videowall_montage", label: "Montage" },
            { key: "videowall_hermontage", label: "Hermontage" },
            { key: "videowall_demontage", label: "Demontage" },
        ],
    },
    {
        titel: "Kiosk",
        items: [
            { key: "kiosk_montage", label: "Montage" },
            { key: "kiosk_hermontage", label: "Hermontage" },
            { key: "kiosk_demontage", label: "Demontage" },
        ],
    },
    {
        titel: "Mediaplayers",
        items: [
            { key: "mediaplayers_montage", label: "Montage" },
            { key: "mediaplayers_hermontage", label: "Hermontage" },
            { key: "mediaplayers_demontage", label: "Demontage" },
        ],
    },
    {
        titel: "Audio",
        items: [
            { key: "audio_montage", label: "Montage" },
            { key: "audio_hermontage", label: "Hermontage" },
            { key: "audio_demontage", label: "Demontage" },
        ],
    },
    {
        titel: "Overig",
        items: [
            { key: "project", label: "Project" },
            { key: "extra_kosten", label: "Extra kosten" },
        ],
    },
];

const KEY_SET = new Set<string>(OPLEVER_MODULE_KEYS);

export function isOpleverModule(value: unknown): value is OpleverModule {
    return typeof value === "string" && KEY_SET.has(value);
}

export function parseOpleverModules(raw: unknown): OpleverModule[] {
    if (!Array.isArray(raw)) {
        return [];
    }

    return [...new Set(raw.filter(isOpleverModule))];
}

const ALLE_INSTALLATIE: OpleverModule[] = OPLEVER_MODULE_KEYS.filter(
    (key) =>
        key !== "uren"
        && key !== "kilometers"
        && key !== "extra_kosten"
);

export function modulesVanLegacyForm(
    formKey: string | null | undefined
): OpleverModule[] {
    if (formKey === "uren") {
        return ["uren", "kilometers"];
    }

    if (formKey === "evalue8") {
        return [
            "uren",
            "kilometers",
            "kiosk_montage",
            "kiosk_hermontage",
            "kiosk_demontage",
            "extra_kosten",
        ];
    }

    if (
        formKey === "digital_signage"
        || formKey === "plus_intake"
        || formKey === "plus_oplevering"
    ) {
        return [
            "uren",
            "kilometers",
            ...ALLE_INSTALLATIE,
            "extra_kosten",
        ];
    }

    return [];
}

/** Opgeslagen modules, of afgeleid van het oude formuliertype. */
export function modulesVanWerkbon(input: {
    opleverModules?: unknown;
    formKey?: string | null;
}): OpleverModule[] {
    if (input.opleverModules != null) {
        return parseOpleverModules(input.opleverModules);
    }

    const fromLegacy = modulesVanLegacyForm(input.formKey);
    if (fromLegacy.length > 0) {
        return fromLegacy;
    }

    // Oude werkbon zonder type: toon het volledige formulier.
    return modulesVanLegacyForm("digital_signage");
}

export function heeftModule(
    modules: readonly string[],
    key: OpleverModule
): boolean {
    return modules.includes(key);
}

export function heeftGroep(
    modules: readonly string[],
    groep: "schermen" | "videowall" | "kiosk" | "mediaplayers" | "audio"
): boolean {
    return modules.some((key) => key.startsWith(`${groep}_`));
}

export function toonChecklist(modules: readonly string[]): boolean {
    return (
        heeftGroep(modules, "schermen")
        || heeftGroep(modules, "videowall")
        || heeftGroep(modules, "kiosk")
        || heeftGroep(modules, "mediaplayers")
    );
}

export function toonInstallatie(modules: readonly string[]): boolean {
    return (
        heeftGroep(modules, "schermen")
        || heeftGroep(modules, "videowall")
        || heeftGroep(modules, "kiosk")
        || heeftGroep(modules, "mediaplayers")
        || heeftGroep(modules, "audio")
        || heeftModule(modules, "project")
    );
}

/**
 * Montage/hermontage vs demontage staat al op de werkbon.
 * Alleen leeg als beide kanten aangevinkt zijn (dan moet de monteur per kiosk kiezen).
 */
export function kioskStatusVanModules(
    modules: readonly string[]
): "" | "Geïnstalleerd" | "Gedemonteerd" {
    const installeert =
        modules.includes("kiosk_montage")
        || modules.includes("kiosk_hermontage");
    const demonteert = modules.includes("kiosk_demontage");

    if (installeert && !demonteert) {
        return "Geïnstalleerd";
    }

    if (demonteert && !installeert) {
        return "Gedemonteerd";
    }

    return "";
}

export function werkzaamhedenHint(
    groep: "schermen" | "videowall" | "kiosk" | "mediaplayers" | "audio",
    modules: readonly string[]
): string {
    const labels: string[] = [];

    if (modules.includes(`${groep}_montage`)) {
        labels.push("montage");
    }
    if (modules.includes(`${groep}_hermontage`)) {
        labels.push("hermontage");
    }
    if (modules.includes(`${groep}_demontage`)) {
        labels.push("demontage");
    }

    return labels.join(" · ");
}
