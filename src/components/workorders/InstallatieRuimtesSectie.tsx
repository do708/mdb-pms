"use client";

import {
    BEUGEL_OPTIES,
    ExtraDiensten,
    InstallatieRuimte,
    InstallatieScherm,
    KABEL_TRAJECT_INTERNET,
    KABEL_TRAJECT_STROOM,
    PLAFOND_MATEN,
    SCHERM_FORMATEN,
    StroomInternetBlok,
    WAND_VAST_MATEN,
    WERKZAAMHEID_OPTIES,
    emptyRuimte,
    syncSchermen,
} from "@/types/installatieRuimtes";

const ACTIES: { value: "nieuw" | "hergebruikt" | "gedemonteerd"; label: string }[] =
    [
        { value: "nieuw", label: "Nieuw gemonteerd" },
        { value: "hergebruikt", label: "Hergebruikt gemonteerd" },
        { value: "gedemonteerd", label: "Gedemonteerd" },
    ];

function Keuze({
    options,
    value,
    onChange,
    columns = 2,
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    columns?: 1 | 2;
}) {
    return (
        <div
            className={
                columns === 1
                    ? "space-y-2"
                    : "grid sm:grid-cols-2 gap-2"
            }
        >
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                        onChange(value === opt.value ? "" : opt.value)
                    }
                    className={
                        "rounded-xl py-2.5 px-3 border-2 text-sm font-medium text-left "
                        +
                        (value === opt.value
                            ? "bg-sky-100 text-sky-900 border-sky-300"
                            : "bg-white text-gray-700 border-gray-200")
                    }
                >
                    {opt.label}
                </button>
            ))}
        </div>
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
    stroom,
    onStroomChange,
    internet,
    onInternetChange,
    extra,
    onExtraChange,
    opmerkingen = "",
    onOpmerkingenChange,
    showOpmerkingen = false,
    uploadFile,
}: Props) {
    function updateRuimte(id: string, patch: Partial<InstallatieRuimte>) {
        onRuimtesChange(
            ruimtes.map((r) => (r.id === id ? { ...r, ...patch } : r))
        );
    }

    function setAantal(id: string, aantal: number) {
        onRuimtesChange(
            ruimtes.map((r) =>
                r.id === id ? syncSchermen(r, aantal) : r
            )
        );
    }

    function updateScherm(
        ruimteId: string,
        schermId: string,
        patch: Partial<InstallatieScherm>
    ) {
        onRuimtesChange(
            ruimtes.map((r) => {
                if (r.id !== ruimteId) {
                    return r;
                }

                return {
                    ...r,
                    schermen: r.schermen.map((s) =>
                        s.id === schermId ? { ...s, ...patch } : s
                    ),
                };
            })
        );
    }

    async function uploadSchermFoto(
        ruimteId: string,
        schermId: string,
        file: File
    ) {
        const result = await uploadFile(file);

        if (result) {
            updateScherm(ruimteId, schermId, { fotoUrl: result.url });
        }
    }

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 border-b pb-1">
                    <h2 className="font-semibold text-gray-800">
                        Ruimtes &amp; installaties
                    </h2>
                    <button
                        type="button"
                        onClick={() =>
                            onRuimtesChange([...ruimtes, emptyRuimte()])
                        }
                        className="text-sm font-semibold text-[#0066FF] hover:underline"
                    >
                        + Ruimte toevoegen
                    </button>
                </div>

                {ruimtes.map((ruimte, index) => (
                    <div
                        key={ruimte.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-5"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <label className="block flex-1">
                                <span className="text-sm font-medium text-gray-700">
                                    Ruimte {index + 1}
                                </span>
                                <input
                                    value={ruimte.naam}
                                    onChange={(e) =>
                                        updateRuimte(ruimte.id, {
                                            naam: e.target.value,
                                        })
                                    }
                                    placeholder="Bijv. Vergaderruimte 1 / Entree"
                                    className="w-full border rounded-xl p-3 mt-1 bg-white"
                                />
                            </label>
                            {ruimtes.length > 1 ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onRuimtesChange(
                                            ruimtes.filter(
                                                (r) => r.id !== ruimte.id
                                            )
                                        )
                                    }
                                    className="text-sm text-red-500 mt-7"
                                >
                                    Verwijderen
                                </button>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                                Type werkzaamheid
                            </p>
                            <Keuze
                                columns={1}
                                value={ruimte.werkzaamheid}
                                options={WERKZAAMHEID_OPTIES}
                                onChange={(v) =>
                                    updateRuimte(ruimte.id, {
                                        werkzaamheid:
                                            v as InstallatieRuimte["werkzaamheid"],
                                    })
                                }
                            />
                        </div>

                        {ruimte.werkzaamheid &&
                        ruimte.werkzaamheid !== "mediaplayer" ? (
                            <>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                        Beugel type
                                    </p>
                                    <Keuze
                                        columns={1}
                                        value={ruimte.beugelType}
                                        options={BEUGEL_OPTIES}
                                        onChange={(v) =>
                                            updateRuimte(ruimte.id, {
                                                beugelType:
                                                    v as InstallatieRuimte["beugelType"],
                                                beugelMaat: "",
                                            })
                                        }
                                    />
                                </div>

                                {ruimte.beugelType === "wand_vast" ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">
                                            Maat wandsteun vast
                                        </p>
                                        <Keuze
                                            value={ruimte.beugelMaat}
                                            options={WAND_VAST_MATEN.map(
                                                (m) => ({
                                                    value: m,
                                                    label: m,
                                                })
                                            )}
                                            onChange={(v) =>
                                                updateRuimte(ruimte.id, {
                                                    beugelMaat: v,
                                                })
                                            }
                                        />
                                    </div>
                                ) : null}

                                {ruimte.beugelType === "plafond" ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">
                                            Lengte plafondsteun
                                        </p>
                                        <Keuze
                                            value={ruimte.beugelMaat}
                                            options={PLAFOND_MATEN.map(
                                                (m) => ({
                                                    value: m,
                                                    label: m,
                                                })
                                            )}
                                            onChange={(v) =>
                                                updateRuimte(ruimte.id, {
                                                    beugelMaat: v,
                                                })
                                            }
                                        />
                                    </div>
                                ) : null}

                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                        Actie
                                    </p>
                                    <Keuze
                                        columns={1}
                                        value={ruimte.actie}
                                        options={ACTIES}
                                        onChange={(v) =>
                                            updateRuimte(ruimte.id, {
                                                actie: v as InstallatieRuimte["actie"],
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                        Oriëntatie
                                    </p>
                                    <Keuze
                                        value={ruimte.orientatie}
                                        options={[
                                            {
                                                value: "landscape",
                                                label: "Landscape",
                                            },
                                            {
                                                value: "portrait",
                                                label: "Portrait",
                                            },
                                        ]}
                                        onChange={(v) =>
                                            updateRuimte(ruimte.id, {
                                                orientatie:
                                                    v as InstallatieRuimte["orientatie"],
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                        Aantal schermen in deze opstelling
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAantal(
                                                    ruimte.id,
                                                    ruimte.aantalSchermen - 1
                                                )
                                            }
                                            className="h-10 w-10 rounded-xl border bg-white text-lg font-bold"
                                        >
                                            −
                                        </button>
                                        <span className="min-w-8 text-center font-semibold text-lg">
                                            {ruimte.aantalSchermen}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAantal(
                                                    ruimte.id,
                                                    ruimte.aantalSchermen + 1
                                                )
                                            }
                                            className="h-10 w-10 rounded-xl border bg-white text-lg font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                        Schermregistratie
                                    </p>
                                    {ruimte.schermen.map((scherm, si) => (
                                        <div
                                            key={scherm.id}
                                            className="rounded-xl border bg-white p-3 space-y-3"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-medium text-sm text-gray-800">
                                                    {scherm.label ||
                                                        `Scherm ${si + 1}`}
                                                </p>
                                                {si > 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const first =
                                                                ruimte
                                                                    .schermen[0];
                                                            updateScherm(
                                                                ruimte.id,
                                                                scherm.id,
                                                                {
                                                                    merkType:
                                                                        first.merkType,
                                                                }
                                                            );
                                                        }}
                                                        className="text-xs font-medium text-[#0066FF]"
                                                    >
                                                        Kopieer Merk &amp; Type
                                                        van Scherm 1
                                                    </button>
                                                ) : null}
                                            </div>

                                            <div className="space-y-1">
                                                <span className="text-sm text-gray-600">
                                                    Foto van scherm /
                                                    typeplaatje
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
                                                            const file =
                                                                e.target
                                                                    .files?.[0];
                                                            if (file) {
                                                                void uploadSchermFoto(
                                                                    ruimte.id,
                                                                    scherm.id,
                                                                    file
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            <label className="block">
                                                <span className="text-sm text-gray-600">
                                                    Formaat / Inch
                                                </span>
                                                <select
                                                    value={scherm.formaat}
                                                    onChange={(e) =>
                                                        updateScherm(
                                                            ruimte.id,
                                                            scherm.id,
                                                            {
                                                                formaat:
                                                                    e.target
                                                                        .value,
                                                            }
                                                        )
                                                    }
                                                    className="w-full border rounded-xl p-2.5 mt-1 bg-white"
                                                >
                                                    <option value="">
                                                        Kies...
                                                    </option>
                                                    {SCHERM_FORMATEN.map(
                                                        (f) => (
                                                            <option
                                                                key={f}
                                                                value={f}
                                                            >
                                                                {f}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </label>

                                            <label className="block">
                                                <span className="text-sm text-gray-600">
                                                    Merk &amp; Type
                                                </span>
                                                <input
                                                    value={scherm.merkType}
                                                    onChange={(e) =>
                                                        updateScherm(
                                                            ruimte.id,
                                                            scherm.id,
                                                            {
                                                                merkType:
                                                                    e.target
                                                                        .value,
                                                            }
                                                        )
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
                                                        updateScherm(
                                                            ruimte.id,
                                                            scherm.id,
                                                            {
                                                                serienummer:
                                                                    e.target
                                                                        .value,
                                                            }
                                                        )
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
                                                        updateScherm(
                                                            ruimte.id,
                                                            scherm.id,
                                                            {
                                                                mac: e.target
                                                                    .value,
                                                            }
                                                        )
                                                    }
                                                    className="w-full border rounded-xl p-2.5 mt-1"
                                                    placeholder="Typ of plak MAC-adres"
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </div>
                ))}
            </div>

            <VoorzieningBlok
                titel="Stroomvoorziening"
                vraag="Is er stroom aanwezig binnen 3 meter van het scherm?"
                dichtstLabel="Dichtstbijzijnde aansluiting"
                trajectOpties={KABEL_TRAJECT_STROOM}
                value={stroom}
                onChange={onStroomChange}
            />

            <VoorzieningBlok
                titel="Internetvoorziening"
                vraag="Is er een netwerkaansluiting (UTP) aanwezig binnen 3 meter?"
                dichtstLabel="Dichtstbijzijnde patchpunt / router"
                trajectOpties={KABEL_TRAJECT_INTERNET}
                value={internet}
                onChange={onInternetChange}
            />

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

function VoorzieningBlok({
    titel,
    vraag,
    dichtstLabel,
    trajectOpties,
    value,
    onChange,
}: {
    titel: string;
    vraag: string;
    dichtstLabel: string;
    trajectOpties: string[];
    value: StroomInternetBlok;
    onChange: (v: StroomInternetBlok) => void;
}) {
    return (
        <div className="space-y-3 rounded-2xl border p-4">
            <h2 className="font-semibold text-gray-800">{titel}</h2>
            <p className="text-sm text-gray-600">{vraag}</p>
            <Keuze
                value={value.aanwezig}
                options={[
                    { value: "Ja", label: "Ja" },
                    { value: "Nee", label: "Nee" },
                ]}
                onChange={(v) =>
                    onChange({
                        aanwezig: v as StroomInternetBlok["aanwezig"],
                        mdbRealiseert: "",
                        dichtstbijzijnde: "",
                        kabelTraject: "",
                    })
                }
            />

            {value.aanwezig === "Nee" ? (
                <div className="pl-3 border-l-2 border-amber-200 space-y-3">
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                            Moet MDB Networks dit realiseren?
                        </p>
                        <Keuze
                            value={value.mdbRealiseert}
                            options={[
                                { value: "Ja", label: "Ja" },
                                { value: "Nee", label: "Nee" },
                            ]}
                            onChange={(v) =>
                                onChange({
                                    ...value,
                                    mdbRealiseert:
                                        v as StroomInternetBlok["mdbRealiseert"],
                                    dichtstbijzijnde: "",
                                    kabelTraject: "",
                                })
                            }
                        />
                    </div>

                    {value.mdbRealiseert === "Ja" ? (
                        <>
                            <label className="block">
                                <span className="text-sm text-gray-600">
                                    {dichtstLabel}
                                </span>
                                <input
                                    value={value.dichtstbijzijnde}
                                    onChange={(e) =>
                                        onChange({
                                            ...value,
                                            dichtstbijzijnde: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-xl p-2.5 mt-1"
                                />
                            </label>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    Kabeltraject
                                </p>
                                <Keuze
                                    columns={1}
                                    value={value.kabelTraject}
                                    options={trajectOpties.map((t) => ({
                                        value: t,
                                        label: t,
                                    }))}
                                    onChange={(v) =>
                                        onChange({
                                            ...value,
                                            kabelTraject: v,
                                        })
                                    }
                                />
                            </div>
                        </>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
