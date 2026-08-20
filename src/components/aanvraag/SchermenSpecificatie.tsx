"use client";

import { useState } from "react";
import {
    AanvraagSchermItem,
    AANSTURING_OPTIES,
    BEVESTIGING_OPTIES,
    FORMAAT_PASTEL,
    PLAFOND_HOOGTE_OPTIES,
    SCHERM_FORMATEN,
    berekendInstallatieType,
    bevestigingDetails,
    isHoofdType,
    isPlayerAansturing,
    legeVoorzieningen,
    normaliseerBevestiging,
    patchRaaktVoorzieningen,
    syncSchermItems,
    syncVoorzieningenVanAnkers,
} from "@/lib/aanvraag/installatieTypes";
import {
    JaNee,
    JaWifiNee,
    MdbRealisatieVervolg,
} from "@/components/aanvraag/StroomInternetVragen";

interface Props {
    aantal: string;
    onAantalChange: (aantal: string) => void;
    items: AanvraagSchermItem[];
    onItemsChange: (items: AanvraagSchermItem[]) => void;
}

export default function SchermenSpecificatie({
    aantal,
    onAantalChange,
    items,
    onItemsChange,
}: Props) {
    const [toondeMaxMelding, setToondeMaxMelding] = useState(false);

    function zetAantal(raw: string) {
        if (raw === "") {
            setToondeMaxMelding(false);
            onAantalChange("");
            onItemsChange([]);
            return;
        }

        const parsed = parseInt(raw, 10);

        if (!Number.isFinite(parsed) || parsed < 0) {
            setToondeMaxMelding(false);
            onAantalChange(raw);
            onItemsChange([]);
            return;
        }

        const probeerdeMeerDan15 = parsed > 15;
        const n = Math.min(15, parsed);

        setToondeMaxMelding(probeerdeMeerDan15);
        onAantalChange(String(n));
        onItemsChange(syncSchermItems(items, n));
    }

    function updateItem(
        id: string,
        patch: Partial<AanvraagSchermItem>
    ) {
        let next = items.map((s) =>
            s.id === id ? { ...s, ...patch } : s
        );

        if (
            patchRaaktVoorzieningen(patch) ||
            "naastSchermId" in patch
        ) {
            next = syncVoorzieningenVanAnkers(next);
        }

        onItemsChange(next);
    }

    return (
        <div className="space-y-4">
            <label className="block">
                <span className="text-xs text-gray-600">
                    Aantal schermen
                </span>
                <input
                    type="number"
                    min={0}
                    max={15}
                    value={aantal}
                    onChange={(e) => zetAantal(e.target.value)}
                    placeholder="Bijv. 2"
                    className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                />
                {toondeMaxMelding ? (
                    <p className="mt-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                        Maximaal 15 schermen. Meer dan 15 schermen geldt als project.
                    </p>
                ) : null}
            </label>

            {items.length > 0 ? (
                <div className="space-y-4">
                    {items.map((scherm, index) => {
                        const type = berekendInstallatieType(
                            scherm,
                            items
                        );
                        const pastel =
                            FORMAAT_PASTEL[scherm.formaat] || {
                                bg: "bg-slate-100",
                                border: "border-slate-300",
                                text: "text-slate-800",
                            };
                        const detailOpties =
                            bevestigingDetails(scherm.beugel);
                        const gekoppeld = Boolean(
                            scherm.naastSchermId
                        );

                        return (
                            <div
                                key={scherm.id}
                                className="rounded-xl border border-sky-200 bg-white p-3 space-y-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-sm text-gray-800">
                                        Scherm {index + 1}
                                    </p>
                                    {type ? (
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/30">
                                            Type {type}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">
                                            Type — vul formaat + bevestiging
                                        </span>
                                    )}
                                </div>

                                {index > 0 ? (
                                    <div className="space-y-1.5">
                                        <p className="text-xs text-gray-600">
                                            Dit scherm monteren{" "}
                                            {(["naast", "b2b"] as const).map(
                                                (optie, oi) => (
                                                    <span key={optie}>
                                                        {oi > 0 ? (
                                                            <span className="text-gray-400">
                                                                {" / "}
                                                            </span>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const ankerId =
                                                                    scherm.naastSchermId
                                                                    || items.find(
                                                                        (s) =>
                                                                            s.id
                                                                            !== scherm.id
                                                                    )?.id
                                                                    || "";

                                                                updateItem(
                                                                    scherm.id,
                                                                    {
                                                                        monterenKoppeling:
                                                                            optie,
                                                                        naastSchermId:
                                                                            ankerId,
                                                                    }
                                                                );
                                                            }}
                                                            className={
                                                                "inline px-0.5 font-semibold underline underline-offset-2 "
                                                                +
                                                                (scherm.monterenKoppeling
                                                                    === optie
                                                                    ? "text-[#0066FF] decoration-[#0066FF]"
                                                                    : "text-gray-500 decoration-dotted decoration-gray-400 hover:text-[#0066FF] hover:decoration-solid")
                                                            }
                                                        >
                                                            {optie}
                                                        </button>
                                                    </span>
                                                )
                                            )}
                                            {" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </p>
                                        {!scherm.monterenKoppeling
                                        && scherm.naastSchermId ? (
                                            <p className="text-xs text-amber-800">
                                                Klik op naast of b2b.
                                            </p>
                                        ) : null}
                                        <select
                                            value={
                                                scherm.naastSchermId ||
                                                "__geen__"
                                            }
                                            onChange={(e) => {
                                                const value =
                                                    e.target.value;

                                                if (
                                                    value ===
                                                    "__geen__"
                                                ) {
                                                    updateItem(
                                                        scherm.id,
                                                        {
                                                            naastSchermId:
                                                                "",
                                                            monterenKoppeling:
                                                                "",
                                                            ...legeVoorzieningen(),
                                                        }
                                                    );
                                                    return;
                                                }

                                                updateItem(
                                                    scherm.id,
                                                    {
                                                        naastSchermId:
                                                            value,
                                                    }
                                                );
                                            }}
                                            className="w-full border rounded-lg p-2 bg-white text-sm"
                                        >
                                            {items
                                                .map((s, si) =>
                                                    s.id ===
                                                    scherm.id
                                                        ? null
                                                        : (
                                                              <option
                                                                  key={
                                                                      s.id
                                                                  }
                                                                  value={
                                                                      s.id
                                                                  }
                                                              >
                                                                  Scherm{" "}
                                                                  {si +
                                                                      1}
                                                                  {s.locatie
                                                                      ? ` (${s.locatie})`
                                                                      : ""}
                                                              </option>
                                                          )
                                                )
                                                .filter(Boolean)}
                                            <option value="__geen__">
                                                Eigen locatie
                                            </option>
                                        </select>
                                    </div>
                                ) : null}

                                <div className="space-y-1.5">
                                    <span className="text-xs text-gray-600">
                                        Formaat / inch{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {SCHERM_FORMATEN.map((f) => {
                                            const c =
                                                FORMAAT_PASTEL[f];
                                            const selected =
                                                scherm.formaat === f;

                                            return (
                                                <button
                                                    key={f}
                                                    type="button"
                                                    disabled={
                                                        gekoppeld
                                                    }
                                                    onClick={() => {
                                                        if (
                                                            gekoppeld
                                                        ) {
                                                            return;
                                                        }
                                                        updateItem(
                                                            scherm.id,
                                                            {
                                                                formaat:
                                                                    selected
                                                                        ? ""
                                                                        : f,
                                                                formaatAnders:
                                                                    "",
                                                            }
                                                        );
                                                    }}
                                                    className={
                                                        "rounded-lg px-3 py-2 border-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed "
                                                        +
                                                        (selected
                                                            ? `${c.bg} ${c.border} ${c.text}`
                                                            : "bg-white text-gray-600 border-gray-200")
                                                    }
                                                >
                                                    {f}
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            disabled={gekoppeld}
                                            onClick={() => {
                                                if (gekoppeld) return;
                                                updateItem(scherm.id, {
                                                    formaat:
                                                        scherm.formaat === "Anders"
                                                            ? ""
                                                            : "Anders",
                                                    formaatAnders: "",
                                                });
                                            }}
                                            className={
                                                "rounded-lg px-3 py-2 border-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed "
                                                +
                                                (scherm.formaat === "Anders"
                                                    ? "bg-slate-200 text-slate-900 border-slate-400"
                                                    : "bg-white text-gray-600 border-gray-200")
                                            }
                                        >
                                            Anders
                                        </button>
                                    </div>
                                    {scherm.formaat === "Anders" ? (
                                        <input
                                            type="text"
                                            disabled={gekoppeld}
                                            value={scherm.formaatAnders || ""}
                                            onChange={(e) =>
                                                updateItem(scherm.id, {
                                                    formaatAnders: e.target.value,
                                                })
                                            }
                                            placeholder='Afwijkend formaat, bijv. 22"'
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-60"
                                        />
                                    ) : scherm.formaat ? (
                                        <p
                                            className={`text-xs ${pastel.text}`}
                                        >
                                            Gekozen: {scherm.formaat}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-xs text-gray-600">
                                        Bevestiging{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {BEVESTIGING_OPTIES.map(
                                            (b) => (
                                                <button
                                                    key={b}
                                                    type="button"
                                                    disabled={
                                                        gekoppeld
                                                    }
                                                    onClick={() => {
                                                        if (
                                                            gekoppeld
                                                        ) {
                                                            return;
                                                        }
                                                        updateItem(
                                                            scherm.id,
                                                            {
                                                                beugel:
                                                                    normaliseerBevestiging(
                                                                        scherm.beugel
                                                                    ) === b
                                                                        ? ""
                                                                        : b,
                                                                bevestigingDetail:
                                                                    "",
                                                                bevestigingAnders:
                                                                    "",
                                                                plafondHoogte:
                                                                    "",
                                                            }
                                                        );
                                                    }}
                                                    className={
                                                        "rounded-lg px-3 py-2 border-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed "
                                                        +
                                                        (normaliseerBevestiging(
                                                            scherm.beugel
                                                        ) === b
                                                            ? "bg-sky-100 text-sky-900 border-sky-300"
                                                            : "bg-white text-gray-700 border-gray-200")
                                                    }
                                                >
                                                    {b}
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {detailOpties.length > 0 ? (
                                        <div className="mt-2 pl-2 border-l-2 border-sky-200 space-y-1.5">
                                            <span className="text-xs text-gray-600 block">
                                                Type{" "}
                                                {normaliseerBevestiging(
                                                    scherm.beugel
                                                ).toLowerCase()}
                                            </span>
                                            <div className="flex flex-col gap-2">
                                                {detailOpties.map(
                                                    (d) => (
                                                        <button
                                                            key={d}
                                                            type="button"
                                                            disabled={
                                                                gekoppeld
                                                            }
                                                            onClick={() => {
                                                                if (
                                                                    gekoppeld
                                                                ) {
                                                                    return;
                                                                }
                                                                updateItem(
                                                                    scherm.id,
                                                                    {
                                                                        bevestigingDetail:
                                                                            scherm.bevestigingDetail ===
                                                                            d
                                                                                ? ""
                                                                                : d,
                                                                        bevestigingAnders:
                                                                            "",
                                                                    }
                                                                );
                                                            }}
                                                            className={
                                                                "w-full rounded-lg px-3 py-2 border-2 text-sm font-medium text-left whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed "
                                                                +
                                                                (scherm.bevestigingDetail ===
                                                                d
                                                                    ? "bg-teal-100 text-teal-900 border-teal-300"
                                                                    : "bg-white text-gray-700 border-gray-200")
                                                            }
                                                        >
                                                            {d}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                            {scherm.bevestigingDetail ===
                                            "Anders" ? (
                                                <input
                                                    type="text"
                                                    disabled={gekoppeld}
                                                    value={
                                                        scherm.bevestigingAnders ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        updateItem(
                                                            scherm.id,
                                                            {
                                                                bevestigingAnders:
                                                                    e.target
                                                                        .value,
                                                            }
                                                        )
                                                    }
                                                    placeholder="Bijv. kolombeugel, speciale constructie…"
                                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-60"
                                                />
                                            ) : null}
                                        </div>
                                    ) : null}

                                    {scherm.beugel ===
                                    "Plafondbeugel" ? (
                                        <div className="mt-2 pl-2 border-l-2 border-violet-200 space-y-1.5">
                                            <span className="text-xs text-gray-600 block">
                                                Hoogte{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {PLAFOND_HOOGTE_OPTIES.map(
                                                    (h) => (
                                                        <button
                                                            key={h}
                                                            type="button"
                                                            disabled={
                                                                gekoppeld
                                                            }
                                                            onClick={() => {
                                                                if (
                                                                    gekoppeld
                                                                ) {
                                                                    return;
                                                                }
                                                                updateItem(
                                                                    scherm.id,
                                                                    {
                                                                        plafondHoogte:
                                                                            scherm.plafondHoogte ===
                                                                            h
                                                                                ? ""
                                                                                : h,
                                                                    }
                                                                );
                                                            }}
                                                            className={
                                                                "rounded-lg px-3 py-2 border-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed "
                                                                +
                                                                (scherm.plafondHoogte ===
                                                                h
                                                                    ? "bg-violet-100 text-violet-900 border-violet-300"
                                                                    : "bg-white text-gray-700 border-gray-200")
                                                            }
                                                        >
                                                            {h}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-xs text-gray-600">
                                        Aansturing{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {AANSTURING_OPTIES.map((a) => {
                                            const geselecteerd =
                                                a === "Player"
                                                    ? isPlayerAansturing(
                                                          scherm.aansturing
                                                      )
                                                    : scherm.aansturing === a;
                                            return (
                                            <button
                                                key={a}
                                                type="button"
                                                disabled={gekoppeld}
                                                onClick={() => {
                                                    if (gekoppeld) {
                                                        return;
                                                    }
                                                    updateItem(scherm.id, {
                                                        aansturing:
                                                            geselecteerd
                                                                ? ""
                                                                : a,
                                                        aansturingAnders: "",
                                                    });
                                                }}
                                                className={
                                                    "rounded-lg px-3 py-2 border-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed "
                                                    +
                                                    (geselecteerd
                                                        ? "bg-amber-100 text-amber-900 border-amber-300"
                                                        : "bg-white text-gray-700 border-gray-200")
                                                }
                                            >
                                                {a}
                                            </button>
                                            );
                                        })}
                                    </div>
                                    {scherm.aansturing === "Anders" ? (
                                        <input
                                            type="text"
                                            disabled={gekoppeld}
                                            value={
                                                scherm.aansturingAnders || ""
                                            }
                                            onChange={(e) =>
                                                updateItem(scherm.id, {
                                                    aansturingAnders:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="Welke aansturing?"
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-60"
                                        />
                                    ) : null}
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-xs text-gray-600">
                                        Oriëntatie{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "Landscape",
                                            "Portrait",
                                        ].map((o) => (
                                            <button
                                                key={o}
                                                type="button"
                                                disabled={gekoppeld}
                                                onClick={() => {
                                                    if (gekoppeld) {
                                                        return;
                                                    }
                                                    updateItem(
                                                        scherm.id,
                                                        {
                                                            orientatie:
                                                                scherm.orientatie ===
                                                                o
                                                                    ? ""
                                                                    : o,
                                                        }
                                                    );
                                                }}
                                                className={
                                                    "flex-1 min-w-[120px] rounded-lg py-2 border-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed "
                                                    +
                                                    (scherm.orientatie ===
                                                    o
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
                                        Locatie scherm{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </span>
                                    <input
                                        value={scherm.locatie}
                                        onChange={(e) =>
                                            updateItem(scherm.id, {
                                                locatie:
                                                    e.target.value,
                                            })
                                        }
                                        disabled={gekoppeld}
                                        placeholder="Bijv. Entree / Vergaderruimte 1"
                                        className="w-full border rounded-lg p-2 mt-0.5 bg-white disabled:bg-slate-50 disabled:text-gray-500"
                                    />
                                    {gekoppeld ? (
                                        <span className="text-[11px] text-gray-500">
                                            Formaat, bevestiging,
                                            oriëntatie, locatie, stroom
                                            en internet overgenomen van
                                            het gekozen scherm
                                        </span>
                                    ) : null}
                                </label>

                                <div className="space-y-2 pt-1 border-t border-slate-100">
                                    <span className="text-xs text-gray-600 block">
                                        Stroom aanwezig binnen 3 meter?{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </span>
                                    <JaNee
                                        value={scherm.stroom}
                                        disabled={gekoppeld}
                                        onChange={(v) =>
                                            updateItem(scherm.id, {
                                                stroom: v,
                                                stroomMdb: "",
                                                stroomAfstand: "",
                                                stroomTraject: "",
                                            })
                                        }
                                    />
                                    {scherm.stroom === "Nee" ? (
                                        <MdbRealisatieVervolg
                                            mdb={scherm.stroomMdb}
                                            afstand={
                                                scherm.stroomAfstand
                                            }
                                            traject={
                                                scherm.stroomTraject
                                            }
                                            disabled={gekoppeld}
                                            onMdbChange={(v) =>
                                                updateItem(
                                                    scherm.id,
                                                    {
                                                        stroomMdb: v,
                                                        stroomAfstand:
                                                            "",
                                                        stroomTraject:
                                                            "",
                                                    }
                                                )
                                            }
                                            onAfstandChange={(
                                                v
                                            ) =>
                                                updateItem(
                                                    scherm.id,
                                                    {
                                                        stroomAfstand:
                                                            v,
                                                    }
                                                )
                                            }
                                            onTrajectChange={(
                                                v
                                            ) =>
                                                updateItem(
                                                    scherm.id,
                                                    {
                                                        stroomTraject:
                                                            v,
                                                    }
                                                )
                                            }
                                        />
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs text-gray-600 block">
                                        Internet aanwezig binnen 3
                                        meter?{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </span>
                                    <JaWifiNee
                                        value={scherm.internet}
                                        disabled={gekoppeld}
                                        onChange={(v) =>
                                            updateItem(scherm.id, {
                                                internet: v,
                                                internetMdb: "",
                                                internetAfstand: "",
                                                internetTraject: "",
                                            })
                                        }
                                    />
                                    {scherm.internet === "Nee" ? (
                                        <MdbRealisatieVervolg
                                            mdb={scherm.internetMdb}
                                            afstand={
                                                scherm.internetAfstand
                                            }
                                            traject={
                                                scherm.internetTraject
                                            }
                                            disabled={gekoppeld}
                                            onMdbChange={(v) =>
                                                updateItem(
                                                    scherm.id,
                                                    {
                                                        internetMdb:
                                                            v,
                                                        internetAfstand:
                                                            "",
                                                        internetTraject:
                                                            "",
                                                    }
                                                )
                                            }
                                            onAfstandChange={(
                                                v
                                            ) =>
                                                updateItem(
                                                    scherm.id,
                                                    {
                                                        internetAfstand:
                                                            v,
                                                    }
                                                )
                                            }
                                            onTrajectChange={(
                                                v
                                            ) =>
                                                updateItem(
                                                    scherm.id,
                                                    {
                                                        internetTraject:
                                                            v,
                                                    }
                                                )
                                            }
                                        />
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}

                    {/* Overzicht berekende types */}
                    <div className="rounded-xl border border-[#0066FF]/20 bg-[#0066FF]/5 p-3">
                        <p className="text-xs font-semibold text-[#0066FF] mb-1.5">
                            Berekende installatietypes
                        </p>
                        <ul className="text-sm text-gray-800 space-y-0.5">
                            {items.map((s, i) => {
                                const t = berekendInstallatieType(
                                    s,
                                    items
                                );
                                const hoofd = isHoofdType(s, items);
                                const naastIndex = s.naastSchermId
                                    ? items.findIndex(
                                          (x) =>
                                              x.id === s.naastSchermId
                                      )
                                    : -1;

                                return (
                                    <li key={s.id}>
                                        Scherm {i + 1}
                                        {s.formaat
                                            ? ` (${s.formaat === "Anders" ? s.formaatAnders || "Anders" : s.formaat})`
                                            : ""}
                                        :{" "}
                                        <strong>
                                            {t
                                                ? `Type ${t}`
                                                : "— vul formaat + bevestiging"}
                                        </strong>
                                        {hoofd
                                            ? " · hoofdtype"
                                            : " · vervolg"}
                                        {naastIndex >= 0
                                            ? ` · ${s.monterenKoppeling === "b2b" ? "b2b" : "naast"} scherm ${naastIndex + 1}`
                                            : ""}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
