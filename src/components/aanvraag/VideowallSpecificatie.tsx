"use client";

import { StroomInternetVragen } from "@/components/aanvraag/StroomInternetVragen";
import {
    chipIdleClassName,
    chipSelectedClassName,
    nestedCardClassName,
} from "@/components/ui/SpecLayout";
import {
    SCHERM_FORMATEN,
} from "@/lib/aanvraag/installatieTypes";
import {
    aantalPanelenVanConfiguratie,
    panelenUitVelden,
    syncVideowallPanelen,
    type VideowallPaneel,
} from "@/lib/workorders/videowallPanelen";
import { normalizeMac } from "@/types/installatieRuimtes";

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
    formaatAlsSelect?: boolean;
}

export default function VideowallSpecificatie({
    velden,
    onChange,
    onPatch,
    onToggleFormaat,
    formaatAlsSelect = false,
}: Props) {
    const type = velden.type || "";
    const gekozenFormaten = parseGekozenOpties(velden.formaat || "");
    const paneelAantal = aantalPanelenVanConfiguratie(
        velden.configuratie || ""
    );
    const panelen = syncVideowallPanelen(
        panelenUitVelden(velden),
        paneelAantal
    );

    function patchPanelen(next: VideowallPaneel[]) {
        onPatch({ panelenJson: JSON.stringify(next) });
    }

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
                                    ? chipSelectedClassName
                                    : chipIdleClassName)
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
                            onChange={(e) => {
                                const configuratie = e.target.value;
                                const count =
                                    aantalPanelenVanConfiguratie(
                                        configuratie
                                    );
                                onPatch({
                                    configuratie,
                                    panelenJson: JSON.stringify(
                                        syncVideowallPanelen(
                                            panelenUitVelden(velden),
                                            count
                                        )
                                    ),
                                });
                            }}
                            placeholder="Bijv. 2x2, 3x3"
                            className="w-full border border-black/10 rounded-lg p-2 mt-0.5 bg-white/70"
                        />
                    </label>
                    {paneelAantal > 0 ? (
                        <p className="text-xs text-gray-500">
                            {paneelAantal} schermen — vul per scherm merk, type
                            en serienummer in.
                        </p>
                    ) : null}

                    <div className="space-y-2">
                        <span className="text-xs text-gray-600 block">
                            Formaat / inch
                            {formaatAlsSelect ? "" : " (meerdere mogelijk)"}
                        </span>
                        {formaatAlsSelect ? (
                            <>
                                <select
                                    value={
                                        VIDEOWALL_FORMATEN.includes(
                                            gekozenFormaten[0] as (typeof VIDEOWALL_FORMATEN)[number]
                                        )
                                            ? gekozenFormaten[0]
                                            : ""
                                    }
                                    onChange={(e) =>
                                        onChange("formaat", e.target.value)
                                    }
                                    className="w-full border border-black/10 rounded-lg p-2.5 bg-white/70 text-sm"
                                >
                                    <option value="">
                                        Kies formaat
                                    </option>
                                    {VIDEOWALL_FORMATEN.map((optie) => (
                                        <option key={optie} value={optie}>
                                            {optie}
                                        </option>
                                    ))}
                                </select>
                                {gekozenFormaten[0] === "Anders" ? (
                                    <input
                                        value={velden.formaatAnders || ""}
                                        onChange={(e) =>
                                            onChange(
                                                "formaatAnders",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Anders formaat (inch)"
                                        className="w-full border border-black/10 rounded-lg p-2 bg-white/70"
                                    />
                                ) : null}
                            </>
                        ) : (
                            <>
                        <div className="flex flex-wrap gap-2">
                            {VIDEOWALL_FORMATEN.map((optie) => {
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
                                            (selected
                                                ? chipSelectedClassName
                                                : chipIdleClassName)
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
                                className="w-full border border-black/10 rounded-lg p-2 bg-white/70"
                            />
                        ) : null}
                            </>
                        )}
                    </div>

                    {paneelAantal > 0 ? (
                        <div className={`${nestedCardClassName} overflow-hidden`}>
                            <p className="px-3 py-2 text-xs font-semibold text-slate-700 bg-black/5 border-b border-black/10">
                                Schermen — gegevens
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse min-w-[28rem]">
                                    <thead>
                                        <tr>
                                            <th className="border-b border-slate-200 p-2 text-left font-medium text-gray-600 w-20">
                                                {" "}
                                            </th>
                                            <th className="border-b border-slate-200 p-2 text-left font-medium text-gray-600">
                                                Merk{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </th>
                                            <th className="border-b border-slate-200 p-2 text-left font-medium text-gray-600">
                                                Type{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </th>
                                            <th className="border-b border-slate-200 p-2 text-left font-medium text-gray-600">
                                                Serienummer{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </th>
                                            <th className="border-b border-slate-200 p-2 text-left font-medium text-gray-600">
                                                MAC-adres
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {panelen.map((paneel, index) => (
                                            <tr key={index}>
                                                <td className="p-1.5 align-middle text-xs font-medium text-gray-500 whitespace-nowrap">
                                                    Scherm {index + 1}
                                                </td>
                                                <td className="p-1.5 align-top">
                                                    <input
                                                        value={paneel.merk}
                                                        onChange={(e) => {
                                                            const next = [
                                                                ...panelen,
                                                            ];
                                                            next[index] = {
                                                                ...paneel,
                                                                merk: e.target.value,
                                                            };
                                                            patchPanelen(next);
                                                        }}
                                                        placeholder="Merk"
                                                        aria-required
                                                        className="w-full border border-black/10 rounded-lg p-2 bg-white/70 text-sm"
                                                    />
                                                </td>
                                                <td className="p-1.5 align-top">
                                                    <input
                                                        value={paneel.type}
                                                        onChange={(e) => {
                                                            const next = [
                                                                ...panelen,
                                                            ];
                                                            next[index] = {
                                                                ...paneel,
                                                                type: e.target.value,
                                                            };
                                                            patchPanelen(next);
                                                        }}
                                                        placeholder="Type"
                                                        aria-required
                                                        className="w-full border border-black/10 rounded-lg p-2 bg-white/70 text-sm"
                                                    />
                                                </td>
                                                <td className="p-1.5 align-top">
                                                    <input
                                                        value={
                                                            paneel.serienummer
                                                        }
                                                        onChange={(e) => {
                                                            const next = [
                                                                ...panelen,
                                                            ];
                                                            next[index] = {
                                                                ...paneel,
                                                                serienummer:
                                                                    e.target.value,
                                                            };
                                                            patchPanelen(next);
                                                        }}
                                                        placeholder="Serienummer"
                                                        aria-required
                                                        className="w-full border border-black/10 rounded-lg p-2 bg-white/70 text-sm"
                                                    />
                                                </td>
                                                <td className="p-1.5 align-top">
                                                    <input
                                                        value={paneel.mac}
                                                        onChange={(e) => {
                                                            const next = [
                                                                ...panelen,
                                                            ];
                                                            next[index] = {
                                                                ...paneel,
                                                                mac: e.target.value,
                                                            };
                                                            patchPanelen(next);
                                                        }}
                                                        onBlur={(e) => {
                                                            const next = [
                                                                ...panelen,
                                                            ];
                                                            next[index] = {
                                                                ...paneel,
                                                                mac: normalizeMac(
                                                                    e.target.value
                                                                ),
                                                            };
                                                            patchPanelen(next);
                                                        }}
                                                        placeholder="Optioneel"
                                                        autoCapitalize="characters"
                                                        spellCheck={false}
                                                        className="w-full border border-black/10 rounded-lg p-2 bg-white/70 text-sm"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}

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
                                            ? chipSelectedClassName
                                            : chipIdleClassName)
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
                            className="w-full border border-black/10 rounded-lg p-2 mt-0.5 bg-white/70"
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
                            className="w-full border border-black/10 rounded-lg p-2 mt-0.5 bg-white/70"
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
                                            ? chipSelectedClassName
                                            : chipIdleClassName)
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
                            className="w-full border border-black/10 rounded-lg p-2 mt-0.5 bg-white/70"
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
