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
            <h2 className="font-semibold text-gray-800 border-b pb-1">
                Productoverzicht
            </h2>
            <p className="text-xs text-gray-500">
                Vink de gewenste productcodes aan en vul het
                aantal in.
            </p>

            {EVALUE8_PRODUCT_GROEPEN.map((groep) => (
                <div key={groep.titel} className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                        {groep.titel}
                    </h3>
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
                                    <label className="flex items-start gap-3 cursor-pointer">
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
                                            className="mt-1 h-4 w-4 accent-sky-600"
                                        />
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-xs font-mono font-semibold text-sky-800">
                                                {p.code}
                                            </span>
                                            <span className="block text-sm text-gray-800">
                                                {p.product}
                                            </span>
                                        </span>
                                    </label>
                                    {item.aan ? (
                                        <label className="mt-2 ml-7 block w-28">
                                            <span className="text-xs text-gray-600">
                                                Aantal
                                            </span>
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
                                                className="w-full border rounded-lg p-2 mt-0.5 bg-white text-sm"
                                            />
                                        </label>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
