"use client";

import {
    FORMAAT_PASTEL,
    SCHERM_FORMATEN,
} from "@/lib/aanvraag/installatieTypes";
import { StroomInternetVragen } from "@/components/aanvraag/StroomInternetVragen";

const VIDEOWALL_FORMATEN = [
    ...SCHERM_FORMATEN.filter((f) => f !== '98"'),
    "Anders",
] as const;

function parseGekozenOpties(waarde: string): string[] {
    if (!waarde.trim()) {
        return [];
    }
    return waarde.split(",").map((s) => s.trim()).filter(Boolean);
}

interface Props {
    velden: Record<string, string>;
    onChange: (veld: string, waarde: string) => void;
    onPatch: (patch: Record<string, string>) => void;
    onToggleFormaat: (optie: string) => void;
}

export default function VideowallSpecificatie({
    velden,
    onChange,
    onPatch,
    onToggleFormaat,
}: Props) {
    const type = velden.type || "";
    const gekozenFormaten = parseGekozenOpties(velden.formaat || "");

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <span className="text-xs text-gray-600 block">
                    Type videowall
                </span>
                <div className="flex flex-wrap gap-2">
                    {(
                        [
                            { k: "LCD", label: "LCD videowall" },
                            { k: "LED", label: "LED videowall" },
                        ] as const
                    ).map((t) => (
                        <button
                            key={t.k}
                            type="button"
                            onClick={() =>
                                onChange(
                                    "type",
                                    type === t.k ? "" : t.k
                                )
                            }
                            className={
                                "flex-1 min-w-[140px] rounded-lg py-2 px-3 border-2 text-sm font-medium "
                                +
                                (type === t.k
                                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                    : "bg-white text-gray-700 border-gray-200")
                            }
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {type === "LCD" ? (
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-gray-600">
                            Configuratie
                        </span>
                        <input
                            value={velden.configuratie || ""}
                            onChange={(e) =>
                                onChange("configuratie", e.target.value)
                            }
                            placeholder="Bijv. 2x2, 3x3"
                            className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                        />
                    </label>

                    <div className="space-y-2">
                        <span className="text-xs text-gray-600 block">
                            Formaat / inch (meerdere mogelijk)
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {VIDEOWALL_FORMATEN.map((optie) => {
                                const pastel = FORMAAT_PASTEL[optie];
                                const selected =
                                    gekozenFormaten.includes(optie);
                                return (
                                    <button
                                        key={optie}
                                        type="button"
                                        onClick={() =>
                                            onToggleFormaat(optie)
                                        }
                                        className={
                                            "rounded-lg px-3 py-2 border-2 text-sm font-medium "
                                            +
                                            (selected && pastel
                                                ? `${pastel.bg} ${pastel.border} ${pastel.text}`
                                                : selected
                                                ? "bg-sky-100 text-sky-900 border-sky-300"
                                                : "bg-white text-gray-700 border-gray-200")
                                        }
                                    >
                                        {optie}
                                    </button>
                                );
                            })}
                        </div>
                        {gekozenFormaten.includes("Anders") ? (
                            <input
                                value={velden.formaatAnders || ""}
                                onChange={(e) =>
                                    onChange(
                                        "formaatAnders",
                                        e.target.value
                                    )
                                }
                                placeholder="Anders formaat (inch)"
                                className="w-full border rounded-lg p-2 bg-white"
                            />
                        ) : null}
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-xs text-gray-600 block">
                            Oriëntatie
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {["Landscape", "Portrait"].map((o) => (
                                <button
                                    key={o}
                                    type="button"
                                    onClick={() =>
                                        onChange(
                                            "orientatie",
                                            velden.orientatie === o
                                                ? ""
                                                : o
                                        )
                                    }
                                    className={
                                        "flex-1 min-w-[120px] rounded-lg py-2 border-2 text-sm font-medium "
                                        +
                                        (velden.orientatie === o
                                            ? "bg-violet-100 text-violet-900 border-violet-300"
                                            : "bg-white text-gray-700 border-gray-200")
                                    }
                                >
                                    {o}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="block">
                        <span className="text-xs text-gray-600">
                            Locatie scherm
                        </span>
                        <input
                            value={velden.locatie || velden.opmerking || ""}
                            onChange={(e) => {
                                onPatch({
                                    locatie: e.target.value,
                                    opmerking: e.target.value,
                                });
                            }}
                            placeholder="Waar komt het scherm?"
                            className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                        />
                    </label>

                    <StroomInternetVragen
                        velden={velden}
                        onChange={(veldOrPatch, waarde) => {
                            if (typeof veldOrPatch === "string") {
                                onChange(veldOrPatch, waarde || "");
                            } else {
                                onPatch(veldOrPatch);
                            }
                        }}
                    />
                </div>
            ) : null}

            {type === "LED" ? (
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-gray-600">
                            Afmeting
                        </span>
                        <input
                            value={velden.afmeting || ""}
                            onChange={(e) =>
                                onChange("afmeting", e.target.value)
                            }
                            placeholder="Bijv. 3 × 2 meter"
                            className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                        />
                    </label>

                    <div className="space-y-1.5">
                        <span className="text-xs text-gray-600 block">
                            Oriëntatie
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {["Landscape", "Portrait"].map((o) => (
                                <button
                                    key={o}
                                    type="button"
                                    onClick={() =>
                                        onChange(
                                            "orientatie",
                                            velden.orientatie === o
                                                ? ""
                                                : o
                                        )
                                    }
                                    className={
                                        "flex-1 min-w-[120px] rounded-lg py-2 border-2 text-sm font-medium "
                                        +
                                        (velden.orientatie === o
                                            ? "bg-violet-100 text-violet-900 border-violet-300"
                                            : "bg-white text-gray-700 border-gray-200")
                                    }
                                >
                                    {o}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="block">
                        <span className="text-xs text-gray-600">
                            Locatie
                        </span>
                        <input
                            value={velden.locatie || ""}
                            onChange={(e) =>
                                onChange("locatie", e.target.value)
                            }
                            placeholder="Waar komt de videowall?"
                            className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                        />
                    </label>

                    <StroomInternetVragen
                        velden={velden}
                        onChange={(veldOrPatch, waarde) => {
                            if (typeof veldOrPatch === "string") {
                                onChange(veldOrPatch, waarde || "");
                            } else {
                                onPatch(veldOrPatch);
                            }
                        }}
                        internetLabel="Internet/data aanwezig binnen 3 meter?"
                    />
                </div>
            ) : null}
        </div>
    );
}
