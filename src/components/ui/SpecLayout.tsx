import type { ReactNode } from "react";

/** Gedeelde Specificatie-kaartstijl voor overzichten en formulieren. */

export const specInputClassName = `
    mt-0.5 w-full border border-gray-200 rounded-lg
    p-2.5 text-sm text-gray-900 bg-white
    placeholder:text-gray-400
`.replace(/\s+/g, " ").trim();

export const specSelectClassName = `
    mt-0.5 w-full border border-gray-200 rounded-lg
    p-2.5 text-sm text-gray-900 bg-white
`.replace(/\s+/g, " ").trim();

/** Keuzeknoppen op pastelkaarten: wit in rust, MDB-blauw of sterke tint als gekozen. */
export const chipIdleClassName =
    "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50";

export const chipSelectedClassName =
    "bg-[#0066FF] text-white border-[#0066FF] shadow-sm";

export const CHIP_SELECTED_TONE = {
    green: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
    red: "bg-red-600 text-white border-red-600 shadow-sm",
    orange: "bg-amber-500 text-white border-amber-500 shadow-sm",
    sky: "bg-[#0066FF] text-white border-[#0066FF] shadow-sm",
    yellow: "bg-slate-700 text-white border-slate-700 shadow-sm",
} as const;

type Tone = "white" | "slate" | "indigo" | "amber" | "emerald";

const TONE: Record<Tone, string> = {
    white: "bg-white border-gray-200",
    slate: "bg-slate-50 border-gray-200",
    indigo: "bg-indigo-50/60 border-indigo-200",
    amber: "bg-amber-50/70 border-amber-200",
    emerald: "bg-emerald-50/60 border-emerald-200",
};

export function PageShell({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <main className={`p-6 space-y-6 ${className}`.trim()}>
            {children}
        </main>
    );
}

export function PageHeader({
    title,
    subtitle,
    actions,
    hideOnMobile = false,
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    hideOnMobile?: boolean;
}) {
    return (
        <header className={`flex flex-wrap items-start justify-between gap-3 ${hideOnMobile ? "hidden lg:flex" : ""}`.trim()}>
            <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">
                    {title}
                </h1>
                {subtitle ? (
                    <p className="text-gray-500 mt-0.5">{subtitle}</p>
                ) : null}
            </div>
            {actions ? (
                <div className="shrink-0 flex flex-wrap gap-2">
                    {actions}
                </div>
            ) : null}
        </header>
    );
}

/** Buitenste witte pagina-kaart (zoals Specificatie-blok op werkbon). */
export function SpecPageCard({
    children,
    className = "",
    id,
}: {
    children: ReactNode;
    className?: string;
    id?: string;
}) {
    return (
        <section
            id={id}
            className={`
                bg-white border rounded-2xl p-5 space-y-3
                ${className}
            `.trim()}
        >
            {children}
        </section>
    );
}

/** Binnenkaart / sectie (locatie, werkzaamheden, filters, tabellen). */
export function SpecPanel({
    title,
    hint,
    tone = "white",
    children,
    className = "",
    actions,
}: {
    title?: ReactNode;
    hint?: ReactNode;
    tone?: Tone;
    children?: ReactNode;
    className?: string;
    actions?: ReactNode;
}) {
    return (
        <div
            className={`
                rounded-xl border p-3 space-y-3
                ${TONE[tone]}
                ${className}
            `.trim()}
        >
            {(title || actions) && (
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                        {title ? (
                            <h2 className="font-semibold text-sm text-gray-800">
                                {title}
                            </h2>
                        ) : null}
                        {hint ? (
                            <p className="text-xs text-gray-500 leading-snug">
                                {hint}
                            </p>
                        ) : null}
                    </div>
                    {actions ? (
                        <div className="shrink-0">{actions}</div>
                    ) : null}
                </div>
            )}
            {!title && hint ? (
                <p className="text-xs text-gray-500 leading-snug">{hint}</p>
            ) : null}
            {children}
        </div>
    );
}

export function SpecFieldLabel({
    children,
}: {
    children: ReactNode;
}) {
    return <span className="text-xs text-gray-500">{children}</span>;
}

/** Compacte rij/kaart in een lijst. */
export function SpecListRow({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`
                rounded-lg border border-gray-200 bg-white
                px-3 py-2.5
                ${className}
            `.trim()}
        >
            {children}
        </div>
    );
}

/** Stat-tegel (rapportages e.d.). */
export function SpecStat({
    label,
    value,
    hint,
    className = "",
}: {
    label: ReactNode;
    value: ReactNode;
    /** Alleen als mouseover-tooltip, niet zichtbaar in de tegel. */
    hint?: string;
    className?: string;
}) {
    return (
        <div
            title={hint || undefined}
            className={`
                h-full min-h-[5.75rem]
                rounded-xl border border-gray-200 bg-white p-3
                flex flex-col gap-1
                ${className}
            `.trim()}
        >
            <p className="text-xs text-gray-500 leading-snug line-clamp-2 min-h-[2.5rem]">
                {label}
            </p>
            <p className="mt-auto text-2xl font-bold text-gray-900 leading-none">
                {value}
            </p>
        </div>
    );
}
