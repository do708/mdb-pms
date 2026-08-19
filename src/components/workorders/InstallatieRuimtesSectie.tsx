"use client";

import {
    AANSTURING_OPTIES,
    BEVESTIGING_DETAIL,
    BEVESTIGING_OPTIES,
    BevestigingSoort,
    PLAFOND_HOOGTE_OPTIES,
    SCHERM_FORMATEN,
    isPlayerAansturing,
} from "@/lib/aanvraag/installatieTypes";
import {
    ExtraDiensten,
    InstallatieRuimte,
    InstallatieScherm,
    StroomInternetBlok,
    emptyRuimte,
    normalizeMac,
    schermHeeftGegevens,
    specsVanScherm,
    syncSchermen,
} from "@/types/installatieRuimtes";

function Chips({
    options,
    value,
    onChange,
    selectedClass = "bg-sky-100 text-sky-900 border-sky-300",
}: {
    options: readonly string[];
    value: string;
    onChange: (v: string) => void;
    selectedClass?: string;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(value === opt ? "" : opt)}
                    className={
                        "rounded-lg px-3 py-2 border-2 text-sm font-medium "
                        +
                        (value === opt
                            ? selectedClass
                            : "bg-white text-gray-700 border-gray-200")
                    }
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}

function JaNeeKleur({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string; kleur: "green" | "orange" | "sky" }[];
}) {
    const klasse = (kleur: string, active: boolean) => {
        if (!active) return "bg-white text-gray-600 border-gray-200";
        if (kleur === "orange") return "bg-amber-100 text-amber-800 border-amber-300";
        if (kleur === "sky") return "bg-sky-100 text-sky-800 border-sky-300";
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    };

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                        onChange(value === opt.value ? "" : opt.value)
                    }
                    className={
                        "rounded-lg px-3 py-2 border-2 text-sm font-medium "
                        + klasse(opt.kleur, value === opt.value)
                    }
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

const KABEL_TRAJECT_P25 = ["P25 Wand", "Systeemplafond"] as const;

function schermSpecsGevuld(s: InstallatieScherm): boolean {
    const formaatOk =
        Boolean(s.formaat)
        && (s.formaat !== "Anders" || Boolean(s.formaatAnders?.trim()));
    return Boolean(
        formaatOk
        && s.beugel
        && s.aansturing
        && s.orientatie
        && (s.locatie || "").trim()
        && s.stroom
        && s.internet
    );
}

interface Props {
    ruimtes: InstallatieRuimte[];
    onRuimtesChange: (ruimtes: InstallatieRuimte[]) => void;
    stroom: StroomInternetBlok;
    onStroomChange: (v: StroomInternetBlok) => void;
    internet: StroomInternetBlok;
    onInternetChange: (v: StroomInternetBlok) => void;
    extra: ExtraDiensten;
    onExtraChange: (v: ExtraDiensten) => void;
    opmerkingen?: string;
    onOpmerkingenChange?: (v: string) => void;
    showOpmerkingen?: boolean;
    uploadFile: (file: File) => Promise<{ url: string; name: string } | null>;
}

export default function InstallatieRuimtesSectie({
    ruimtes,
    onRuimtesChange,
    extra,
    onExtraChange,
    opmerkingen = "",
    onOpmerkingenChange,
    showOpmerkingen = false,
}: Props) {
    const schermKaarten = ruimtes.flatMap((ruimte) =>
        ruimte.schermen.map((scherm) => ({
            ruimteId: ruimte.id,
            scherm,
        }))
    );

    function updateScherm(
        ruimteId: string,
        schermId: string,
        patch: Partial<InstallatieScherm>
    ) {
        onRuimtesChange(
            ruimtes.map((r) => {
                if (r.id !== ruimteId) return r;
                return {
                    ...r,
                    schermen: r.schermen.map((s) =>
                        s.id === schermId ? { ...s, ...patch } : s
                    ),
                };
            })
        );
    }

    function addScherm() {
        if (ruimtes.length === 0) {
            onRuimtesChange([emptyRuimte()]);
            return;
        }
        const last = ruimtes[ruimtes.length - 1];
        onRuimtesChange(
            ruimtes.map((r) =>
                r.id === last.id
                    ? syncSchermen(r, r.aantalSchermen + 1)
                    : r
            )
        );
    }

    function removeScherm(ruimteId: string, schermId: string) {
        const next = ruimtes
            .map((r) => {
                if (r.id !== ruimteId) return r;
                const schermen = r.schermen.filter((s) => s.id !== schermId);
                if (schermen.length === 0) return null;
                return {
                    ...r,
                    aantalSchermen: schermen.length,
                    schermen: schermen.map((s, i) => ({
                        ...s,
                        label: `Scherm ${i + 1}`,
                    })),
                };
            })
            .filter((r): r is InstallatieRuimte => r !== null);

        onRuimtesChange(next.length > 0 ? next : [emptyRuimte()]);
    }

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 border-b pb-1">
                    <h2 className="text-sm font-semibold text-gray-800">
                        Schermen &amp; installatie
                    </h2>
                    <button
                        type="button"
                        onClick={addScherm}
                        className="text-sm font-semibold text-[#0066FF] hover:underline"
                    >
                        + Scherm toevoegen
                    </button>
                </div>

                {schermKaarten.map(({ ruimteId, scherm }, index) => {
                    const detailOpties =
                        scherm.beugel && scherm.beugel in BEVESTIGING_DETAIL
                            ? BEVESTIGING_DETAIL[
                                  scherm.beugel as BevestigingSoort
                              ]
                            : [];
                    const specsOk = schermSpecsGevuld(scherm);
                    const toonPlayer = isPlayerAansturing(scherm.aansturing);
                    const bronnen =
                        index > 0
                            ? schermKaarten
                                  .slice(0, index)
                                  .map((kaart, bronIndex) => ({
                                      ...kaart,
                                      bronIndex,
                                  }))
                                  .filter((kaart) =>
                                      schermHeeftGegevens(kaart.scherm)
                                  )
                            : [];

                    return (
                        <div
                            key={scherm.id}
                            className="rounded-xl border border-sky-200 bg-white p-3 space-y-3"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-sm text-gray-800">
                                    Scherm {index + 1}
                                </p>
                                {schermKaarten.length > 1 ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeScherm(ruimteId, scherm.id)
                                        }
                                        className="text-xs text-red-500"
                                    >
                                        Verwijderen
                                    </button>
                                ) : null}
                            </div>
                            {bronnen.length > 0 ? (
                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                        {bronnen.map((bron) => (
                                            <button
                                                key={bron.scherm.id}
                                                type="button"
                                                onClick={() =>
                                                    updateScherm(
                                                        ruimteId,
                                                        scherm.id,
                                                        specsVanScherm(
                                                            bron.scherm
                                                        )
                                                    )
                                                }
                                                className="text-xs font-medium text-[#0066FF] hover:underline"
                                            >
                                                Neem over van scherm{" "}
                                                {bron.bronIndex + 1}
                                            </button>
                                        ))}
                                    </div>
                            ) : null}
                            <div className="space-y-1.5">
                                <span className="text-xs text-gray-600">
                                    Formaat / inch{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <select
                                    value={scherm.formaat || ""}
                                    onChange={(e) =>
                                        updateScherm(ruimteId, scherm.id, {
                                            formaat: e.target.value,
                                            formaatAnders: "",
                                        })
                                    }
                                    className="w-full border rounded-lg p-2.5 bg-white text-sm"
                                >
                                    <option value="">Kies formaat</option>
                                    {SCHERM_FORMATEN.map((f) => (
                                        <option key={f} value={f}>
                                            {f}
                                        </option>
                                    ))}
                                    <option value="Anders">Anders</option>
                                </select>
                                {scherm.formaat === "Anders" ? (
                                    <input
                                        type="text"
                                        value={scherm.formaatAnders || ""}
                                        onChange={(e) =>
                                            updateScherm(ruimteId, scherm.id, {
                                                formaatAnders: e.target.value,
                                            })
                                        }
                                        placeholder='Afwijkend formaat, bijv. 22"'
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                ) : null}
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-xs text-gray-600">
                                    Bevestiging{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <select
                                    value={scherm.beugel || ""}
                                    onChange={(e) =>
                                        updateScherm(ruimteId, scherm.id, {
                                            beugel: e.target.value,
                                            bevestigingDetail: "",
                                            bevestigingAnders: "",
                                            plafondHoogte: "",
                                        })
                                    }
                                    className="w-full border rounded-lg p-2.5 bg-white text-sm"
                                >
                                    <option value="">Kies bevestiging</option>
                                    {BEVESTIGING_OPTIES.map((b) => (
                                        <option key={b} value={b}>
                                            {b}
                                        </option>
                                    ))}
                                </select>
                                {detailOpties.length > 0 ? (
                                    <select
                                        value={scherm.bevestigingDetail || ""}
                                        onChange={(e) =>
                                            updateScherm(ruimteId, scherm.id, {
                                                bevestigingDetail: e.target.value,
                                                bevestigingAnders: "",
                                            })
                                        }
                                        className="w-full border rounded-lg p-2.5 bg-white text-sm"
                                    >
                                        <option value="">
                                            Type {scherm.beugel.toLowerCase()}
                                        </option>
                                        {detailOpties.map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                ) : null}
                                {scherm.bevestigingDetail === "Anders" ? (
                                    <input
                                        type="text"
                                        value={scherm.bevestigingAnders || ""}
                                        onChange={(e) =>
                                            updateScherm(ruimteId, scherm.id, {
                                                bevestigingAnders: e.target.value,
                                            })
                                        }
                                        placeholder="Welke bevestiging?"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                ) : null}
                                {scherm.beugel === "Plafondbeugel" ? (
                                    <select
                                        value={scherm.plafondHoogte || ""}
                                        onChange={(e) =>
                                            updateScherm(ruimteId, scherm.id, {
                                                plafondHoogte: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg p-2.5 bg-white text-sm"
                                    >
                                        <option value="">
                                            Lengte plafondbeugel
                                        </option>
                                        {PLAFOND_HOOGTE_OPTIES.map((h) => (
                                            <option key={h} value={h}>
                                                {h}
                                            </option>
                                        ))}
                                    </select>
                                ) : null}
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-xs text-gray-600">
                                    Aansturing{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <select
                                    value={
                                        isPlayerAansturing(scherm.aansturing)
                                            ? "Player"
                                            : scherm.aansturing || ""
                                    }
                                    onChange={(e) =>
                                        updateScherm(ruimteId, scherm.id, {
                                            aansturing: e.target.value,
                                            aansturingAnders: "",
                                        })
                                    }
                                    className="w-full border rounded-lg p-2.5 bg-white text-sm"
                                >
                                    <option value="">Kies aansturing</option>
                                    {AANSTURING_OPTIES.map((a) => (
                                        <option key={a} value={a}>
                                            {a}
                                        </option>
                                    ))}
                                </select>
                                {scherm.aansturing === "Anders" ? (
                                    <input
                                        type="text"
                                        value={scherm.aansturingAnders || ""}
                                        onChange={(e) =>
                                            updateScherm(ruimteId, scherm.id, {
                                                aansturingAnders: e.target.value,
                                            })
                                        }
                                        placeholder="Welke aansturing?"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                ) : null}
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-xs text-gray-600">
                                    Oriëntatie{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <Chips
                                    options={["Landscape", "Portrait"]}
                                    value={scherm.orientatie || ""}
                                    onChange={(v) =>
                                        updateScherm(ruimteId, scherm.id, {
                                            orientatie: v,
                                        })
                                    }
                                    selectedClass="bg-violet-100 text-violet-900 border-violet-300"
                                />
                            </div>

                            <label className="block">
                                <span className="text-xs text-gray-600">
                                    Locatie scherm{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <input
                                    value={scherm.locatie || ""}
                                    onChange={(e) =>
                                        updateScherm(ruimteId, scherm.id, {
                                            locatie: e.target.value,
                                        })
                                    }
                                    placeholder="Bijv. Entree / Vergaderruimte 1"
                                    className="w-full border rounded-lg p-2 mt-0.5 bg-white text-sm"
                                />
                            </label>

                            <div className="space-y-1.5">
                                <span className="text-xs text-gray-600">
                                    Stroom aanwezig binnen 3 meter?{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <JaNeeKleur
                                    value={scherm.stroom || ""}
                                    onChange={(v) =>
                                        updateScherm(ruimteId, scherm.id, {
                                            stroom: v as InstallatieScherm["stroom"],
                                            stroomGerealiseerd: "",
                                            stroomMeter: "",
                                            stroomTraject: "",
                                        })
                                    }
                                    options={[
                                        { value: "Ja", label: "Ja", kleur: "green" },
                                        { value: "Nee", label: "Nee", kleur: "orange" },
                                    ]}
                                />
                                {scherm.stroom === "Nee" ? (
                                    <div className="pl-2 border-l-2 border-amber-200 space-y-2">
                                        <span className="text-xs text-gray-600">
                                            Heb je dit gerealiseerd?
                                        </span>
                                        <JaNeeKleur
                                            value={scherm.stroomGerealiseerd || ""}
                                            onChange={(v) =>
                                                updateScherm(ruimteId, scherm.id, {
                                                    stroomGerealiseerd:
                                                        v as InstallatieScherm["stroomGerealiseerd"],
                                                    stroomMeter: "",
                                                    stroomTraject: "",
                                                })
                                            }
                                            options={[
                                                { value: "Ja", label: "Ja", kleur: "green" },
                                                { value: "Nee", label: "Nee", kleur: "orange" },
                                            ]}
                                        />
                                        {scherm.stroomGerealiseerd === "Ja" ? (
                                            <>
                                                <label className="block">
                                                    <span className="text-xs text-gray-600">
                                                        Hoeveel meter?
                                                    </span>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={scherm.stroomMeter || ""}
                                                        onChange={(e) =>
                                                            updateScherm(
                                                                ruimteId,
                                                                scherm.id,
                                                                { stroomMeter: e.target.value }
                                                            )
                                                        }
                                                        placeholder="Bijv. 8"
                                                        className="w-full border rounded-lg p-2 mt-0.5 bg-white text-sm"
                                                    />
                                                </label>
                                                <Chips
                                                    options={KABEL_TRAJECT_P25}
                                                    value={scherm.stroomTraject || ""}
                                                    onChange={(v) =>
                                                        updateScherm(
                                                            ruimteId,
                                                            scherm.id,
                                                            { stroomTraject: v }
                                                        )
                                                    }
                                                />
                                            </>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-xs text-gray-600">
                                    Internet aanwezig binnen 3 meter?{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <JaNeeKleur
                                    value={scherm.internet || ""}
                                    onChange={(v) =>
                                        updateScherm(ruimteId, scherm.id, {
                                            internet: v as InstallatieScherm["internet"],
                                            internetGerealiseerd: "",
                                            internetMeter: "",
                                            internetTraject: "",
                                        })
                                    }
                                    options={[
                                        { value: "Ja", label: "Ja", kleur: "green" },
                                        { value: "Wifi", label: "Wifi", kleur: "sky" },
                                        { value: "Nee", label: "Nee", kleur: "orange" },
                                    ]}
                                />
                                {scherm.internet === "Nee" ? (
                                    <div className="pl-2 border-l-2 border-amber-200 space-y-2">
                                        <span className="text-xs text-gray-600">
                                            Heb je dit gerealiseerd?
                                        </span>
                                        <JaNeeKleur
                                            value={scherm.internetGerealiseerd || ""}
                                            onChange={(v) =>
                                                updateScherm(ruimteId, scherm.id, {
                                                    internetGerealiseerd:
                                                        v as InstallatieScherm["internetGerealiseerd"],
                                                    internetMeter: "",
                                                    internetTraject: "",
                                                })
                                            }
                                            options={[
                                                { value: "Ja", label: "Ja", kleur: "green" },
                                                { value: "Nee", label: "Nee", kleur: "orange" },
                                            ]}
                                        />
                                        {scherm.internetGerealiseerd === "Ja" ? (
                                            <>
                                                <label className="block">
                                                    <span className="text-xs text-gray-600">
                                                        Hoeveel meter?
                                                    </span>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={scherm.internetMeter || ""}
                                                        onChange={(e) =>
                                                            updateScherm(
                                                                ruimteId,
                                                                scherm.id,
                                                                { internetMeter: e.target.value }
                                                            )
                                                        }
                                                        placeholder="Bijv. 8"
                                                        className="w-full border rounded-lg p-2 mt-0.5 bg-white text-sm"
                                                    />
                                                </label>
                                                <Chips
                                                    options={KABEL_TRAJECT_P25}
                                                    value={scherm.internetTraject || ""}
                                                    onChange={(v) =>
                                                        updateScherm(
                                                            ruimteId,
                                                            scherm.id,
                                                            { internetTraject: v }
                                                        )
                                                    }
                                                />
                                            </>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>

                            {specsOk ? (
                                <div className="rounded-xl border bg-slate-50 p-3 space-y-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                        Schermregistratie
                                    </p>

                                    <label className="block">
                                        <span className="text-sm text-gray-600">
                                            Merk &amp; Type
                                        </span>
                                        <input
                                            value={scherm.merkType}
                                            onChange={(e) =>
                                                updateScherm(ruimteId, scherm.id, {
                                                    merkType: e.target.value,
                                                })
                                            }
                                            className="w-full border rounded-xl p-2.5 mt-1"
                                            placeholder="Bijv. Samsung QM55B"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-sm text-gray-600">
                                            Serienummer
                                        </span>
                                        <input
                                            value={scherm.serienummer}
                                            onChange={(e) =>
                                                updateScherm(ruimteId, scherm.id, {
                                                    serienummer: e.target.value,
                                                })
                                            }
                                            className="w-full border rounded-xl p-2.5 mt-1"
                                            placeholder="Typ of plak serienummer"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-sm text-gray-600">
                                            MAC-adres
                                        </span>
                                        <input
                                            value={scherm.mac}
                                            onChange={(e) =>
                                                updateScherm(ruimteId, scherm.id, {
                                                    mac: e.target.value,
                                                })
                                            }
                                            onBlur={(e) =>
                                                updateScherm(ruimteId, scherm.id, {
                                                    mac: normalizeMac(
                                                        e.target.value
                                                    ),
                                                })
                                            }
                                            className="w-full border rounded-xl p-2.5 mt-1"
                                            placeholder="Typ of plak MAC-adres"
                                            autoCapitalize="characters"
                                            spellCheck={false}
                                        />
                                    </label>
                                </div>
                            ) : null}

                            {specsOk && toonPlayer ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                        Playerregistratie
                                    </p>

                                    <label className="block">
                                        <span className="text-sm text-gray-600">
                                            Merk &amp; Type player
                                        </span>
                                        <input
                                            value={scherm.playerMerkType || ""}
                                            onChange={(e) =>
                                                updateScherm(ruimteId, scherm.id, {
                                                    playerMerkType: e.target.value,
                                                })
                                            }
                                            className="w-full border rounded-xl p-2.5 mt-1 bg-white"
                                            placeholder="Bijv. BrightSign LS425"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-sm text-gray-600">
                                            Serienummer player
                                        </span>
                                        <input
                                            value={scherm.playerSerienummer || ""}
                                            onChange={(e) =>
                                                updateScherm(ruimteId, scherm.id, {
                                                    playerSerienummer: e.target.value,
                                                })
                                            }
                                            className="w-full border rounded-xl p-2.5 mt-1 bg-white"
                                            placeholder="Typ of plak serienummer"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-sm text-gray-600">
                                            MAC-adres player
                                        </span>
                                        <input
                                            value={scherm.playerMac || ""}
                                            onChange={(e) =>
                                                updateScherm(ruimteId, scherm.id, {
                                                    playerMac: e.target.value,
                                                })
                                            }
                                            onBlur={(e) =>
                                                updateScherm(ruimteId, scherm.id, {
                                                    playerMac: normalizeMac(
                                                        e.target.value
                                                    ),
                                                })
                                            }
                                            className="w-full border rounded-xl p-2.5 mt-1 bg-white"
                                            placeholder="Typ of plak MAC-adres"
                                            autoCapitalize="characters"
                                            spellCheck={false}
                                        />
                                    </label>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            <div className="space-y-3">
                <h2 className="font-semibold text-gray-800 border-b pb-1">
                    Extra diensten
                </h2>
                {(
                    [
                        ["afval", "Afval/verpakking afvoeren"],
                        ["afvoerTm50", 'Oud scherm afvoeren (t/m 50")'],
                        ["afvoerVanaf50", 'Oud scherm afvoeren (vanaf 50")'],
                    ] as const
                ).map(([key, label]) => (
                    <label
                        key={key}
                        className="flex items-center gap-3 rounded-xl border px-3 py-2.5 bg-white cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            checked={extra[key]}
                            onChange={(e) =>
                                onExtraChange({
                                    ...extra,
                                    [key]: e.target.checked,
                                })
                            }
                            className="h-4 w-4 accent-[#0066FF]"
                        />
                        <span className="text-sm text-gray-800">{label}</span>
                    </label>
                ))}
            </div>

            {showOpmerkingen && onOpmerkingenChange ? (
                <label className="block">
                    <span className="text-sm font-semibold text-gray-800">
                        Opmerkingen / notities
                    </span>
                    <textarea
                        rows={4}
                        value={opmerkingen}
                        onChange={(e) =>
                            onOpmerkingenChange(e.target.value)
                        }
                        placeholder="Bijzonderheden, oplevernotities of afwijkingen"
                        className="w-full border rounded-xl p-3 mt-1"
                    />
                </label>
            ) : null}
        </div>
    );
}
