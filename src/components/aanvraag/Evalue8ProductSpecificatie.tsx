"use client";

import {
    EVALUE8_PRODUCT_GROEPEN,
} from "@/lib/aanvraag/evalue8Producten";

export type Evalue8SelectieState = Record<
    string,
    { aan: boolean; aantal: string }
>;

interface Props {
    selectie: Evalue8SelectieState;
    onChange: (next: Evalue8SelectieState) => void;
}

export default function Evalue8ProductSpecificatie({
    selectie,
    onChange,
}: Props) {
    function zet(
        code: string,
        patch: Partial<{ aan: boolean; aantal: string }>
    ) {
        const huidig = selectie[code] || {
            aan: false,
            aantal: "1",
        };
        onChange({
            ...selectie,
            [code]: { ...huidig, ...patch },
        });
    }

    return (
        <div className="space-y-4">
            {EVALUE8_PRODUCT_GROEPEN.map((groep) => (
                <div key={groep.titel} className="space-y-2">
                    {groep.titel !== "Productoverzicht" ? (
                        <h3 className="text-sm font-semibold text-gray-700">
                            {groep.titel}
                        </h3>
                    ) : null}
                    <div className="space-y-2">
                        {groep.producten.map((p) => {
                            const item = selectie[p.code] || {
                                aan: false,
                                aantal: "1",
                            };

                            return (
                                <div
                                    key={p.code}
                                    className={
                                        "rounded-xl border p-3 transition "
                                        +
                                        (item.aan
                                            ? "bg-sky-50 border-sky-300"
                                            : "bg-white border-slate-200")
                                    }
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={item.aan}
                                            onChange={(e) =>
                                                zet(p.code, {
                                                    aan: e.target
                                                        .checked,
                                                    aantal:
                                                        item.aantal
                                                        || "1",
                                                })
                                            }
                                            className="h-4 w-4 shrink-0 accent-sky-600"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-mono font-semibold text-sky-800">
                                                {p.code}
                                            </span>
                                            <span className="text-sm text-gray-800">
                                                {" "}
                                                — {p.product}
                                            </span>
                                        </div>
                                        {item.aan ? (
                                            <input
                                                type="number"
                                                min={1}
                                                value={
                                                    item.aantal
                                                }
                                                onChange={(e) =>
                                                    zet(p.code, {
                                                        aantal: e
                                                            .target
                                                            .value,
                                                    })
                                                }
                                                aria-label="Aantal"
                                                className="w-16 shrink-0 border rounded-lg px-2 py-1.5 bg-white text-sm text-center"
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
