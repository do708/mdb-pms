"use client";

import { StroomInternetVragen } from "@/components/aanvraag/StroomInternetVragen";
import {
    chipIdleClassName,
    chipSelectedClassName,
    nestedCardClassName,
} from "@/components/ui/SpecLayout";
import {
    AANSTURING_OPTIES,
    SCHERM_FORMATEN,
    isAansturingMetApparaat,
    isPlayerAansturing,
} from "@/lib/aanvraag/installatieTypes";
import {
    aantalPanelenVanConfiguratie,
    panelenUitVelden,
    syncVideowallPanelen,
    type VideowallPaneel,
} from "@/lib/workorders/videowallPanelen";
import { HardwareKenmerkenTabel } from "@/components/workorders/InstallatieRuimtesSectie";
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

function kopieerMerkTypeNaarAlleSchermen(
    panelen: VideowallPaneel[]
): VideowallPaneel[] {
    const bron =
        panelen.find((paneel) => paneel.merk.trim() || paneel.type.trim())
        ?? panelen[0];
    if (!bron) {
        return panelen;
    }
    return panelen.map((paneel) => ({
        ...paneel,
        merk: bron.merk,
        type: bron.type,
    }));
}

function LocatieVeld({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (waarde: string) => void;
    placeholder: string;
}) {
    return (
        <label className="block">
            <span className="text-xs text-gray-600">
                Locatie
            </span>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-black/10 rounded-lg p-2 mt-0.5 bg-white/70"
            />
        </label>
    );
}

function AansturingBlok({
    velden,
    onChange,
    onPatch,
    showOpleverDetails,
}: {
    velden: Record<string, string>;
    onChange: (veld: string, waarde: string) => void;
    onPatch: (patch: Record<string, string>) => void;
    showOpleverDetails: boolean;
}) {
    const aansturing = velden.aansturing || "";
    const toonApparaat = isAansturingMetApparaat(aansturing);

    return (
        <>
            <div className="space-y-1.5">
                <span className="text-xs text-gray-600">
                    Aansturing{" "}
                    <span className="text-red-500">*</span>
                </span>
                <select
                    value={
                        isPlayerAansturing(aansturing)
                            ? "Player"
                            : aansturing
                    }
                    onChange={(e) =>
                        onPatch({
                            aansturing: e.target.value,
                            aansturingAnders: "",
                        })
                    }
                    className="w-full border border-black/10 rounded-lg p-2.5 bg-white/70 text-sm"
                >
                    <option value="">Kies aansturing</option>
                    {AANSTURING_OPTIES.map((optie) => (
                        <option key={optie} value={optie}>
                            {optie}
                        </option>
                    ))}
                </select>
                {aansturing === "Anders" ? (
                    <input
                        type="text"
                        value={velden.aansturingAnders || ""}
                        onChange={(e) =>
                            onChange("aansturingAnders", e.target.value)
                        }
                        placeholder="Welke aansturing?"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                ) : null}
            </div>
            {showOpleverDetails && toonApparaat ? (
                <HardwareKenmerkenTabel
                    titel={
                        isPlayerAansturing(aansturing)
                            ? "Aansturing (player)"
                            : aansturing === "Anders"
                              ? `Aansturing (${velden.aansturingAnders || "anders"})`
                              : `Aansturing (${aansturing})`
                    }
                    merk={velden.playerMerk || ""}
                    type={velden.playerType || ""}
                    serienummer={velden.playerSerienummer || ""}
                    mac={velden.playerMac || ""}
                    onChange={(patch) =>
                        onPatch({
                            ...(patch.merk !== undefined
                                ? { playerMerk: patch.merk }
                                : {}),
                            ...(patch.type !== undefined
                                ? { playerType: patch.type }
                                : {}),
                            ...(patch.serienummer !== undefined
                                ? { playerSerienummer: patch.serienummer }
                                : {}),
                            ...(patch.mac !== undefined
                                ? { playerMac: patch.mac }
                                : {}),
                        })
                    }
                />
            ) : null}
        </>
    );
}

function ControllerBlok({
    velden,
    onChange,
}: {
    velden: Record<string, string>;
    onChange: (veld: string, waarde: string) => void;
}) {
    return (
        <HardwareKenmerkenTabel
            titel="Controller"
            merk={velden.controllerMerk || ""}
            type={velden.controllerType || ""}
            serienummer={velden.controllerSerienummer || ""}
            mac={velden.controllerIp || ""}
            vierdeLabel="IP-adres"
            vierdePlaceholder="Optioneel"
            normaliseerVierdeWaarde={false}
            onChange={(patch) => {
                if (patch.merk !== undefined) {
                    onChange("controllerMerk", patch.merk);
                }
                if (patch.type !== undefined) {
                    onChange("controllerType", patch.type);
                }
                if (patch.serienummer !== undefined) {
                    onChange("controllerSerienummer", patch.serienummer);
                }
                if (patch.mac !== undefined) {
                    onChange("controllerIp", patch.mac);
                }
            }}
        />
    );
}

interface Props {
    velden: Record<string, string>;
    onChange: (veld: string, waarde: string) => void;
    onPatch: (patch: Record<string, string>) => void;
    onToggleFormaat: (optie: string) => void;
    formaatAlsSelect?: boolean;
    showOpleverDetails?: boolean;
}

export default function VideowallSpecificatie({
    velden,
    onChange,
    onPatch,
    onToggleFormaat,
    formaatAlsSelect = false,
    showOpleverDetails = false,
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

    function patchPaneel(
        index: number,
        patch: Partial<VideowallPaneel>
    ) {
        const next = [...panelen];
        next[index] = { ...next[index], ...patch };
        patchPanelen(next);
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
                    <LocatieVeld
                        value={velden.locatie || velden.opmerking || ""}
                        onChange={(waarde) =>
                            onPatch({
                                locatie: waarde,
                                opmerking: waarde,
                            })
                        }
                        placeholder="Waar komt het scherm?"
                    />
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
                    {showOpleverDetails ? (
                        <>
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
                        <div className="space-y-2">
                            {paneelAantal > 1 ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        patchPanelen(
                                            kopieerMerkTypeNaarAlleSchermen(
                                                panelen
                                            )
                                        )
                                    }
                                    className="text-sm font-semibold text-[#0066FF] hover:underline"
                                >
                                    Kopieer merk en type naar alle schermen
                                </button>
                            ) : null}
                            <div className={`${nestedCardClassName} overflow-hidden`}>
                            <p className="px-3 py-2 text-xs font-semibold text-slate-700 bg-black/5 border-b border-black/10">
                                Schermen — gegevens
                            </p>
                            <div className="space-y-4 p-3 md:hidden">
                                {panelen.map((paneel, index) => (
                                    <div key={index} className="space-y-3">
                                        <p className="text-xs font-semibold text-slate-600">
                                            Scherm {index + 1}
                                        </p>
                                        {([
                                            ["merk", "Merk", "Merk"],
                                            ["type", "Type", "Type"],
                                            ["serienummer", "Serienummer", "Serienummer"],
                                            ["mac", "MAC-adres", "Optioneel"],
                                        ] as const).map(([key, label, placeholder]) => (
                                            <label key={key} className="block min-w-0">
                                                <span className="block text-xs font-medium text-gray-600">
                                                    {label}
                                                    {key !== "mac" ? (
                                                        <>
                                                            {" "}
                                                            <span className="text-red-500">*</span>
                                                        </>
                                                    ) : null}
                                                </span>
                                                <input
                                                    value={paneel[key]}
                                                    onChange={(e) =>
                                                        patchPaneel(index, {
                                                            [key]: e.target.value,
                                                        })
                                                    }
                                                    onBlur={
                                                        key === "mac"
                                                            ? (e) =>
                                                                  patchPaneel(index, {
                                                                      mac: normalizeMac(
                                                                          e.target.value
                                                                      ),
                                                                  })
                                                            : undefined
                                                    }
                                                    placeholder={placeholder}
                                                    aria-required={key !== "mac" || undefined}
                                                    autoCapitalize={
                                                        key === "mac"
                                                            ? "characters"
                                                            : undefined
                                                    }
                                                    spellCheck={
                                                        key === "mac"
                                                            ? false
                                                            : undefined
                                                    }
                                                    className="mt-1 w-full min-w-0 rounded-lg border border-black/10 bg-white/70 p-2.5 text-sm"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="hidden md:block">
                                <table className="w-full table-fixed text-sm border-collapse">
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
                                                        onChange={(e) =>
                                                            patchPaneel(index, {
                                                                merk: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Merk"
                                                        aria-required
                                                        className="w-full border border-black/10 rounded-lg p-2 bg-white/70 text-sm"
                                                    />
                                                </td>
                                                <td className="p-1.5 align-top">
                                                    <input
                                                        value={paneel.type}
                                                        onChange={(e) =>
                                                            patchPaneel(index, {
                                                                type: e.target.value,
                                                            })
                                                        }
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
                                                        onChange={(e) =>
                                                            patchPaneel(index, {
                                                                serienummer:
                                                                    e.target.value,
                                                            })
                                                        }
                                                        placeholder="Serienummer"
                                                        aria-required
                                                        className="w-full border border-black/10 rounded-lg p-2 bg-white/70 text-sm"
                                                    />
                                                </td>
                                                <td className="p-1.5 align-top">
                                                    <input
                                                        value={paneel.mac}
                                                        onChange={(e) =>
                                                            patchPaneel(index, {
                                                                mac: e.target.value,
                                                            })
                                                        }
                                                        onBlur={(e) =>
                                                            patchPaneel(index, {
                                                                mac: normalizeMac(
                                                                    e.target.value
                                                                ),
                                                            })
                                                        }
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
                        </div>
                    ) : null}
                        </>
                    ) : null}

                    <AansturingBlok
                        velden={velden}
                        onChange={onChange}
                        onPatch={onPatch}
                        showOpleverDetails={showOpleverDetails}
                    />

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
                    <LocatieVeld
                        value={velden.locatie || ""}
                        onChange={(waarde) => onChange("locatie", waarde)}
                        placeholder="Waar komt de videowall?"
                    />
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

                    {showOpleverDetails ? (
                        <>
                            <label className="block">
                                <span className="text-xs text-gray-600">
                                    Cabinet-afmeting
                                </span>
                                <input
                                    value={velden.cabinetAfmeting || ""}
                                    onChange={(e) =>
                                        onChange(
                                            "cabinetAfmeting",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Bijv. 500 × 500 mm"
                                    className="w-full border border-black/10 rounded-lg p-2 mt-0.5 bg-white/70"
                                />
                            </label>

                            <label className="block">
                                <span className="text-xs text-gray-600">
                                    Resolutie per cabinet
                                </span>
                                <input
                                    value={
                                        velden.resolutiePerCabinet || ""
                                    }
                                    onChange={(e) =>
                                        onChange(
                                            "resolutiePerCabinet",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Bijv. 128 × 128"
                                    className="w-full border border-black/10 rounded-lg p-2 mt-0.5 bg-white/70"
                                />
                            </label>

                            <label className="block">
                                <span className="text-xs text-gray-600">
                                    Aantal cabinetten
                                </span>
                                <input
                                    value={velden.aantalCabinetten || ""}
                                    onChange={(e) =>
                                        onChange(
                                            "aantalCabinetten",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Bijv. 24"
                                    className="w-full border border-black/10 rounded-lg p-2 mt-0.5 bg-white/70"
                                />
                            </label>
                        </>
                    ) : null}

                    <AansturingBlok
                        velden={velden}
                        onChange={onChange}
                        onPatch={onPatch}
                        showOpleverDetails={showOpleverDetails}
                    />

                    {showOpleverDetails ? (
                        <ControllerBlok
                            velden={velden}
                            onChange={onChange}
                        />
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
