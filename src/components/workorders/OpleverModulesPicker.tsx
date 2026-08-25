"use client";

import {
    OPLEVER_MODULE_GROEPEN,
    type OpleverModule,
} from "@/lib/workorders/opleverModules";

interface Props {
    value: OpleverModule[];
    onChange: (next: OpleverModule[]) => void;
    hint?: string;
}

export default function OpleverModulesPicker({
    value,
    onChange,
    hint,
}: Props) {
    function toggle(key: OpleverModule) {
        if (value.includes(key)) {
            onChange(value.filter((item) => item !== key));
        } else {
            onChange([...value, key]);
        }
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
            <div>
                <h2 className="font-semibold text-sm text-gray-800">
                    Opleverformulier
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                    {hint
                        || "Vink aan wat de monteur moet invullen. Opmerkingen, materialen, afronding, handtekening en foto’s staan altijd op de werkbon."}
                </p>
            </div>

            <div className="space-y-3">
                {OPLEVER_MODULE_GROEPEN.map((groep) => (
                    <div key={groep.titel}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                            {groep.titel}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {groep.items.map((item) => {
                                const gekozen = value.includes(item.key);

                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => toggle(item.key)}
                                        className={`
                                            px-3 py-1.5 rounded-xl border text-sm
                                            transition
                                            ${
                                                gekozen
                                                    ? "bg-blue-50 border-blue-400 text-blue-800 font-medium"
                                                    : "bg-white border-slate-200 text-gray-600 hover:border-slate-300"
                                            }
                                        `}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
