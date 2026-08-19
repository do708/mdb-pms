"use client";

import {
    AANSTURING_OPTIES,
    BEVESTIGING_DETAIL,
    BEVESTIGING_OPTIES,
    BevestigingSoort,
    FORMAAT_PASTEL,
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
    uploadFile,
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

    async function uploadFoto(
        ruimteId: string,
        schermId: string,
        file: File,
        field: "fotoUrl" | "playerFotoUrl"
    ) {
        const result = await uploadFile(file);
        if (result) {
            updateScherm(ruimteId, schermId, { [field]: result.url });
        }
    }

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 border-b pb-1">
                    <h2 className="font-semibold text-gray-800">
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
                    const pastel =
                        FORMAAT_PASTEL[scherm.formaat] || {
                            bg: "bg-slate-100",
                            border: "border-slate-300",
                            text: "text-slate-800",
                        };
                    const detailOpties =
                        scherm.beugel && scherm.beugel in BEVESTIGING_DETAIL
                            ? BEVESTIGING_DETAIL[
                                  scherm.beugel as BevestigingSoort
                              ]
                            : [];
                    const specsOk = schermSpecsGevuld(scherm);
                    const toonPlayer = isPlayerAansturing(scherm.aansturing);

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
                            <p className="text-xs text-gray-400">
                                Type — vul formaat + bevestiging
                            </p>

                            <div className="space-y-1.5">
                                <span className="text-xs text-gray-600">
                                    Formaat / inch{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {SCHERM_FORMATEN.map((f) => {
                                        const c = FORMAAT_PASTEL[f];
                                        const selected = scherm.formaat === f;
                                        return (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={() =>
                                                    updateScherm(
                                                        ruimteId,
                                                        scherm.id,
                                                        {
                                                            formaat: selected ? "" : f,
                                                            formaatAnders: "",
                                                        }
                                                    )
                                                }
                                                className={
                                                    "rounded-lg px-3 py-2 border-2 text-sm font-medium "
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
                                        onClick={() =>
                                            updateScherm(ruimteId, scherm.id, {
                                                formaat:
                                                    scherm.formaat === "Anders"
                                                        ? ""
                                                        : "Anders",
                                                formaatAnders: "",
                                            })
                                        }
                                        className={
                                            "rounded-lg px-3 py-2 border-2 text-sm font-medium "
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
                                        value={scherm.formaatAnders || ""}
                                        onChange={(e) =>
                                            updateScherm(ruimteId, scherm.id, {
                                                formaatAnders: e.target.value,
                                            })
                                        }
                                        placeholder='Afwijkend formaat, bijv. 22"'
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                ) : scherm.formaat ? (
                                    <p className={`text-xs ${pastel.text}`}>
                                        Gekozen: {scherm.formaat}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-xs text-gray-600">
                                    Bevestiging{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <Chips
                                    options={BEVESTIGING_OPTIES}
                                    value={scherm.beugel || ""}
                                    onChange={(v) =>
                                        updateScherm(ruimteId, scherm.id, {
                                            beugel: v,
                                            bevestigingDetail: "",
                                            bevestigingAnders: "",
                                            plafondHoogte: "",
                                        })
                                    }
                                />
                                {detailOpties.length > 0 ? (
                                    <div className="mt-2 pl-2 border-l-2 border-sky-200 space-y-1.5">
                                        <span className="text-xs text-gray-600 block">
                                            Type {scherm.beugel.toLowerCase()}
                                        </span>
                                        <div className="flex flex-col gap-2">
                                            {detailOpties.map((d) => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() =>
                                                        updateScherm(
                                                            ruimteId,
                                                            scherm.id,
                                                            {
                                                                bevestigingDetail:
                                                                    scherm.bevestigingDetail === d
                                                                        ? ""
                                                                        : d,
                                                                bevestigingAnders: "",
                                                            }
                                                        )
                                                    }
                                                    className={
                                                        "w-full rounded-lg px-3 py-2 border-2 text-sm font-medium text-left "
                                                        +
                                                        (scherm.bevestigingDetail === d
                                                            ? "bg-teal-100 text-teal-900 border-teal-300"
                                                            : "bg-white text-gray-700 border-gray-200")
                                                    }
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                        {scherm.bevestigingDetail === "Anders" ? (
                                            <input
                                                type="text"
                                                value={scherm.bevestigingAnders || ""}
                                                onChange={(e) =>
                                                    updateScherm(
                                                        ruimteId,
                                                        scherm.id,
                                                        {
                                                            bevestigingAnders:
                                                                e.target.value,
                                                        }
                                                    )
                                                }
                                                placeholder="Welke bevestiging?"
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                            />
                                        ) : null}
                                    </div>
                                ) : null}
                                {scherm.beugel === "Plafondbeugel" ? (
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-600">
                                            Lengte plafondbeugel
                                        </span>
                                        <Chips
                                            options={PLAFOND_HOOGTE_OPTIES}
                                            value={scherm.plafondHoogte || ""}
                                            onChange={(v) =>
                                                updateScherm(ruimteId, scherm.id, {
                                                    plafondHoogte: v,
                                                })
                                            }
                                        />
                                    </div>
                                ) : null}
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-xs text-gray-600">
                                    Aansturing{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <Chips
                                    options={AANSTURING_OPTIES}
                                    value={
                                        isPlayerAansturing(scherm.aansturing)
                                            ? "Player"
                                            : scherm.aansturing || ""
                                    }
                                    onChange={(v) =>
                                        updateScherm(ruimteId, scherm.id, {
                                            aansturing: v,
                                            aansturingAnders: "",
                                        })
                                    }
                                    selectedClass="bg-amber-100 text-amber-900 border-amber-300"
                                />
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
                                <Chips
                                    options={["Ja", "Nee"]}
                                    value={scherm.stroom || ""}
                                    onChange={(v) =>
                                        updateScherm(ruimteId, scherm.id, {
                                            stroom: v as InstallatieScherm["stroom"],
                                        })
                                    }
                                    selectedClass="bg-emerald-100 text-emerald-800 border-emerald-300"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-xs text-gray-600">
                                    Internet aanwezig binnen 3 meter?{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <Chips
                                    options={["Ja", "Wifi", "Nee"]}
                                    value={scherm.internet || ""}
                                    onChange={(v) =>
                                        updateScherm(ruimteId, scherm.id, {
                                            internet: v as InstallatieScherm["internet"],
                                        })
                                    }
                                    selectedClass="bg-emerald-100 text-emerald-800 border-emerald-300"
                                />
                            </div>

                            {specsOk ? (
                                <div className="rounded-xl border bg-slate-50 p-3 space-y-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                        Schermregistratie
                                    </p>

                                    <div className="space-y-1">
                                        <span className="text-sm text-gray-600">
                                            Foto van scherm / typeplaatje
                                        </span>
                                        {scherm.fotoUrl ? (
                                            <a
                                                href={scherm.fotoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block text-sm text-sky-600 underline"
                                            >
                                                Foto bekijken
                                            </a>
                                        ) : null}
                                        <label className="inline-block cursor-pointer text-sm font-medium text-[#0066FF] border border-dashed rounded-xl px-3 py-2">
                                            Maak foto / Upload
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        void uploadFoto(
                                                            ruimteId,
                                                            scherm.id,
                                                            file,
                                                            "fotoUrl"
                                                        );
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>

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
                                            className="w-full border rounded-xl p-2.5 mt-1"
                                            placeholder="Typ of plak MAC-adres"
                                        />
                                    </label>
                                </div>
                            ) : null}

                            {specsOk && toonPlayer ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                        Playerregistratie
                                    </p>

                                    <div className="space-y-1">
                                        <span className="text-sm text-gray-600">
                                            Foto van de player
                                        </span>
                                        {scherm.playerFotoUrl ? (
                                            <a
                                                href={scherm.playerFotoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block text-sm text-sky-600 underline"
                                            >
                                                Foto bekijken
                                            </a>
                                        ) : null}
                                        <label className="inline-block cursor-pointer text-sm font-medium text-[#0066FF] border border-dashed rounded-xl px-3 py-2 bg-white">
                                            Maak foto / Upload
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        void uploadFoto(
                                                            ruimteId,
                                                            scherm.id,
                                                            file,
                                                            "playerFotoUrl"
                                                        );
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>

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
                                            className="w-full border rounded-xl p-2.5 mt-1 bg-white"
                                            placeholder="Typ of plak MAC-adres"
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
                    Extra diensten &amp; afvoeren
                </h2>
                {(
                    [
                        ["afvoerTm50", 'Oud scherm afvoeren (t/m 50")'],
                        ["afvoerVanaf50", 'Oud scherm afvoeren (vanaf 50")'],
                        ["afval", "Afval/verpakking afvoeren"],
                        [
                            "audio",
                            "Radiospeler / Geluidsinstallatie aansluiten",
                        ],
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
