"use client";

export const WERKZAAMHEID_ACTIES = [
    "Monteren",
    "Herplaatsen",
    "Demonteren",
] as const;

export type WerkzaamheidActie = (typeof WERKZAAMHEID_ACTIES)[number];

export type ActieAantallenWaarde = {
    Monteren: string;
    Herplaatsen: string;
    Demonteren: string;
};

export function emptyActieAantallen(): ActieAantallenWaarde {
    return { Monteren: "", Herplaatsen: "", Demonteren: "" };
}

const ACTIEF: Record<WerkzaamheidActie, string> = {
    Monteren: "bg-emerald-100 text-emerald-800 border-emerald-300",
    Herplaatsen: "bg-sky-100 text-sky-800 border-sky-300",
    Demonteren: "bg-amber-100 text-amber-800 border-amber-300",
};

/** Eén keuze per item (scherm, kiosk). */
export function ActieKeuze({
    value,
    onChange,
    label = "Wat is er met dit item gedaan?",
}: {
    value: string;
    onChange: (v: WerkzaamheidActie | "") => void;
    label?: string;
}) {
    return (
        <div className="space-y-1.5">
            <span className="text-xs text-gray-600 block">
                {label}
            </span>
            <div className="flex gap-2">
                {WERKZAAMHEID_ACTIES.map((optie) => (
                    <button
                        key={optie}
                        type="button"
                        onClick={() =>
                            onChange(value === optie ? "" : optie)
                        }
                        className={
                            "flex-1 min-w-0 rounded-lg py-2 px-1.5 border-2 text-xs font-medium "
                            +
                            (value === optie
                                ? ACTIEF[optie]
                                : "bg-white text-gray-700 border-gray-200")
                        }
                    >
                        {optie}
                    </button>
                ))}
            </div>
        </div>
    );
}

/** Meerdere acties tegelijk, met aantal (videowall, mediaplayers, audio). */
export function ActieAantallen({
    value,
    onChange,
    label = "Wat is er gedaan? (meerdere mogelijk)",
}: {
    value: ActieAantallenWaarde;
    onChange: (next: ActieAantallenWaarde) => void;
    label?: string;
}) {
    return (
        <div className="space-y-1.5">
            <span className="text-xs text-gray-600 block">
                {label}
            </span>
            <div className="space-y-2">
                {WERKZAAMHEID_ACTIES.map((optie) => {
                    const aantal = value[optie] || "";
                    const aan = Boolean(aantal.trim());
                    return (
                        <div
                            key={optie}
                            className="flex items-center gap-2"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    onChange({
                                        ...value,
                                        [optie]: aan ? "" : (aantal || "1"),
                                    })
                                }
                                className={
                                    "flex-1 rounded-lg py-2 px-3 border-2 text-sm font-medium text-left "
                                    +
                                    (aan
                                        ? ACTIEF[optie]
                                        : "bg-white text-gray-700 border-gray-200")
                                }
                            >
                                {optie}
                            </button>
                            {aan ? (
                                <input
                                    inputMode="numeric"
                                    value={aantal}
                                    placeholder="Aantal"
                                    onChange={(e) =>
                                        onChange({
                                            ...value,
                                            [optie]: e.target.value,
                                        })
                                    }
                                    className="w-20 shrink-0 border rounded-lg p-2 text-sm bg-white"
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
