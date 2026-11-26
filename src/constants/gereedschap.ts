/** Categorieën voor MDB-assetcodes (MDB-{cat}-#####). */
export const TOOL_CATEGORIES = ["G", "L", "T", "E", "M"] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
    G: "Gereedschap (hand)",
    L: "Ladders / klimmaterieel (NEN 2484)",
    T: "Transport / aanhanger",
    E: "Elektrisch gereedschap (NEN 3140)",
    M: "Meetapparatuur",
};

export const TOOL_CATEGORY_NORM: Record<ToolCategory, string> = {
    G: "Algemene visuele keuring",
    L: "NEN 2484",
    T: "Visuele veiligheidskeuring",
    E: "NEN 3140",
    M: "Kalibratie / functionele check",
};

export function isToolCategory(value: string): value is ToolCategory {
    return (TOOL_CATEGORIES as readonly string[]).includes(value);
}

/** Opgeslagen / afgeleide statussen. */
export const TOOL_STATUSES = [
    "nog_te_keuren",
    "goedgekeurd",
    "binnenkort",
    "verlopen",
    "afgekeurd",
    "gearchiveerd",
] as const;

export type ToolStatus = (typeof TOOL_STATUSES)[number];

export const TOOL_STATUS_LABELS: Record<ToolStatus, string> = {
    nog_te_keuren: "Nog te keuren",
    goedgekeurd: "Goedgekeurd",
    binnenkort: "Binnenkort keuren",
    verlopen: "Verlopen",
    afgekeurd: "Afgekeurd",
    gearchiveerd: "Gearchiveerd",
};

export const TOOL_STATUS_COLORS: Record<ToolStatus, string> = {
    nog_te_keuren: "bg-slate-100 text-slate-800 border-slate-300",
    goedgekeurd: "bg-emerald-50 text-emerald-800 border-emerald-300",
    binnenkort: "bg-amber-50 text-amber-900 border-amber-300",
    verlopen: "bg-orange-50 text-orange-900 border-orange-300",
    afgekeurd: "bg-red-50 text-red-800 border-red-300",
    gearchiveerd: "bg-gray-100 text-gray-600 border-gray-300",
};

export const INSPECTION_RESULTS = ["goedgekeurd", "afgekeurd"] as const;
export type InspectionResult = (typeof INSPECTION_RESULTS)[number];

export type ChecklistItemDef = {
    id: string;
    label: string;
};

/** Stub-checklists per categorie — uitbreidbaar zonder schema-wijziging. */
export const TOOL_CHECKLISTS: Record<ToolCategory, ChecklistItemDef[]> = {
    G: [
        { id: "visueel", label: "Visuele inspectie (scheuren, slijtage, corrosie)" },
        { id: "handvatten", label: "Handvatten / isolatie intact" },
        { id: "bewegend", label: "Bewegende delen soepel en veilig" },
        { id: "markering", label: "Identificatie / markering leesbaar" },
    ],
    L: [
        { id: "sporten", label: "Sporten / treden onbeschadigd (NEN 2484)" },
        { id: "stijlen", label: "Stijlen recht, geen scheuren" },
        { id: "voetplaten", label: "Voetplaten / antislip aanwezig" },
        { id: "scharnieren", label: "Scharnieren / spreidstand borging OK" },
        { id: "stickers", label: "Keuringsticker / typeplaatje leesbaar" },
    ],
    T: [
        { id: "banden", label: "Banden / wielen in orde" },
        { id: "verlichting", label: "Verlichting / reflectoren werken" },
        { id: "koppeling", label: "Koppeling / dissel veilig" },
        { id: "vastzet", label: "Vastzetpunten / spanbanden OK" },
    ],
    E: [
        { id: "behuizing", label: "Behuizing onbeschadigd (NEN 3140)" },
        { id: "kabel", label: "Snoer / stekker intact, geen blanke aders" },
        { id: "schakelaar", label: "Schakelaar / bediening werkt" },
        { id: "isolatie", label: "Isolatieweerstand / aardlek (stub)" },
        { id: "label", label: "Keuringsetiket aanwezig en geldig" },
    ],
    M: [
        { id: "display", label: "Display / uitlezing leesbaar" },
        { id: "kalibratie", label: "Kalibratie binnen termijn" },
        { id: "probes", label: "Probes / meetsnoeren intact" },
        { id: "functie", label: "Functionele test geslaagd" },
    ],
};

/** Dagen vóór geldigheid → status "binnenkort". */
export const TOOL_DUE_SOON_DAYS = 30;

/** Standaard geldigheid na goedkeuring (maanden). */
export const TOOL_VALIDITY_MONTHS: Record<ToolCategory, number> = {
    G: 12,
    L: 12,
    T: 12,
    E: 12,
    M: 12,
};
