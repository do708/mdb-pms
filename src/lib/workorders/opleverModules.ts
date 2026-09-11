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

export const OPLEVER_WERKZAAMHEDEN = [
    { key: "montage", titel: "montage" },
    { key: "hermontage", titel: "hermontage" },
    { key: "demontage", titel: "gedemonteerd" },
] as const;

export type OpleverWerkzaamheid = (typeof OPLEVER_WERKZAAMHEDEN)[number]["key"];

const WERKZAAMHEID_SET = new Set<string>(
    OPLEVER_WERKZAAMHEDEN.map((item) => item.key)
);

export function isOpleverWerkzaamheid(
    value: unknown
): value is OpleverWerkzaamheid {
    return typeof value === "string" && WERKZAAMHEID_SET.has(value);
}

export type OpleverInstallatieGroep =
    | "schermen"
    | "videowall"
    | "kiosk"
    | "mediaplayers"
    | "audio";

export function actieveWerkzaamheden(
    groep: OpleverInstallatieGroep,
    modules: readonly string[]
): OpleverWerkzaamheid[] {
    return OPLEVER_WERKZAAMHEDEN
        .filter((item) => modules.includes(`${groep}_${item.key}`))
        .map((item) => item.key);
}

export function vakTitel(
    groepLabel: string,
    type: OpleverWerkzaamheid
): string {
    const titel =
        OPLEVER_WERKZAAMHEDEN.find((item) => item.key === type)?.titel
        ?? type;
    return `${groepLabel} ${titel}`;
}

export function actieVanWerkzaamheid(
    type: OpleverWerkzaamheid
): "nieuw" | "hergebruikt" | "gedemonteerd" {
    if (type === "hermontage") {
        return "hergebruikt";
    }
    if (type === "demontage") {
        return "gedemonteerd";
    }
    return "nieuw";
}

export function werkzaamheidVanActie(
    actie: string
): OpleverWerkzaamheid | "" {
    if (actie === "nieuw") {
        return "montage";
    }
    if (actie === "hergebruikt") {
        return "hermontage";
    }
    if (actie === "gedemonteerd") {
        return "demontage";
    }
    return "";
}

export function installatieStatusVanWerkzaamheid(
    type: OpleverWerkzaamheid
): "Geïnstalleerd" | "Gedemonteerd" {
    return type === "demontage" ? "Gedemonteerd" : "Geïnstalleerd";
}

export function fallbackWerkzaamheid(
    types: readonly OpleverWerkzaamheid[]
): OpleverWerkzaamheid {
    if (types.includes("montage")) {
        return "montage";
    }
    if (types.includes("hermontage")) {
        return "hermontage";
    }
    if (types.includes("demontage")) {
        return "demontage";
    }
    return "montage";
}

/** Opgeslagen type, of de enige/eerste aangevinkte als het type niet (meer) bestaat. */
export function resolvedWerkzaamheid(
    opgeslagen: OpleverWerkzaamheid | "",
    actieve: readonly OpleverWerkzaamheid[]
): OpleverWerkzaamheid {
    if (opgeslagen && (actieve.length === 0 || actieve.includes(opgeslagen))) {
        return opgeslagen;
    }
    return fallbackWerkzaamheid(actieve);
}

export function itemPastBijWerkzaamheid(
    opgeslagen: OpleverWerkzaamheid | "",
    type: OpleverWerkzaamheid,
    actieve: readonly OpleverWerkzaamheid[]
): boolean {
    return resolvedWerkzaamheid(opgeslagen, actieve) === type;
}

export function werkzaamhedenHint(
    groep: OpleverInstallatieGroep,
    modules: readonly string[]
): string {
    return actieveWerkzaamheden(groep, modules)
        .map((type) =>
            OPLEVER_WERKZAAMHEDEN.find((item) => item.key === type)?.titel
            ?? type
        )
        .join(" · ");
}
