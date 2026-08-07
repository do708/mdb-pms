"use client";

import {
    AanvraagRuimte,
    AanvraagScherm,
    BEUGEL_OPTIES,
    ExtraDiensten,
    KABEL_TRAJECT_INTERNET,
    KABEL_TRAJECT_STROOM,
    PLAFOND_MATEN,
    SCHERM_FORMATEN,
    StroomInternetBlok,
    WAND_VAST_MATEN,
    WERKZAAMHEID_OPTIES,
    emptyRuimte,
    syncSchermen,
} from "@/types/aanvraagInstallatie";

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
    ruimtes: AanvraagRuimte[];
    onRuimtesChange: (ruimtes: AanvraagRuimte[]) => void;
    stroom: StroomInternetBlok;
    onStroomChange: (v: StroomInternetBlok) => void;
    internet: StroomInternetBlok;
    onInternetChange: (v: StroomInternetBlok) => void;
    extra: ExtraDiensten;
    onExtraChange: (v: ExtraDiensten) => void;
    opmerkingen: string;
    onOpmerkingenChange: (v: string) => void;
    uploadFile: (file: File) => Promise<{ url: string; name: string } | null>;
}

export default function InstallatieSectie({
    ruimtes,
    onRuimtesChange,
    stroom,
    onStroomChange,
    internet,
    onInternetChange,
    extra,
    onExtraChange,
    opmerkingen,
    onOpmerkingenChange,
    uploadFile,
}: Props) {
    function updateRuimte(id: string, patch: Partial<AanvraagRuimte>) {
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
        patch: Partial<AanvraagScherm>
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
            {/* Sectie 2 */}
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
                                    className="text-xs text-red-600 mt-8 shrink-0"
                                >
                                    Verwijder
                                </button>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-800">
                                Type werkzaamheid
                            </p>
                            <Keuze
                                options={WERKZAAMHEID_OPTIES}
                                value={ruimte.werkzaamheid}
                                onChange={(v) =>
                                    updateRuimte(ruimte.id, {
                                        werkzaamheid:
                                            v as AanvraagRuimte["werkzaamheid"],
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-800">
                                Beugel type
                            </p>
                            <Keuze
                                options={BEUGEL_OPTIES}
                                value={ruimte.beugelType}
                                onChange={(v) =>
                                    updateRuimte(ruimte.id, {
                                        beugelType:
                                            v as AanvraagRuimte["beugelType"],
                                        beugelMaat: "",
                                    })
                                }
                            />
                            {ruimte.beugelType === "wand_vast" ? (
                                <div className="pt-1">
                                    <p className="text-xs text-gray-500 mb-1">
                                        Maat wandsteun
                                    </p>
                                    <Keuze
                                        options={WAND_VAST_MATEN.map((m) => ({
                                            value: m,
                                            label: m,
                                        }))}
                                        value={ruimte.beugelMaat}
                                        onChange={(v) =>
                                            updateRuimte(ruimte.id, {
                                                beugelMaat: v,
                                            })
                                        }
                                    />
                                </div>
                            ) : null}
                            {ruimte.beugelType === "plafond" ? (
                                <div className="pt-1">
                                    <p className="text-xs text-gray-500 mb-1">
                                        Lengte plafondsteun
                                    </p>
                                    <Keuze
                                        options={PLAFOND_MATEN.map((m) => ({
                                            value: m,
                                            label: m,
                                        }))}
                                        value={ruimte.beugelMaat}
                                        onChange={(v) =>
                                            updateRuimte(ruimte.id, {
                                                beugelMaat: v,
                                            })
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-800">
                                Actie
                            </p>
                            <Keuze
                                options={ACTIES}
                                value={ruimte.actie}
                                onChange={(v) =>
                                    updateRuimte(ruimte.id, {
                                        actie: v as AanvraagRuimte["actie"],
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-800">
                                Oriëntatie
                            </p>
                            <Keuze
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
                                value={ruimte.orientatie}
                                onChange={(v) =>
                                    updateRuimte(ruimte.id, {
                                        orientatie:
                                            v as AanvraagRuimte["orientatie"],
                                    })
                                }
                            />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">
                                Aantal schermen in deze opstelling
                            </p>
                            <div className="inline-flex items-center gap-3 rounded-xl border bg-white px-2 py-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAantal(
                                            ruimte.id,
                                            ruimte.aantalSchermen - 1
                                        )
                                    }
                                    className="h-9 w-9 rounded-lg bg-slate-100 font-bold text-lg"
                                >
                                    −
                                </button>
                                <span className="tabular-nums font-semibold w-6 text-center">
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
                                    className="h-9 w-9 rounded-lg bg-slate-100 font-bold text-lg"
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
                                    className="rounded-xl border border-sky-200 bg-white p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-sky-900">
                                            Scherm {si + 1}
                                        </p>
                                        {si > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const first =
                                                        ruimte.schermen[0];
                                                    updateScherm(
                                                        ruimte.id,
                                                        scherm.id,
                                                        {
                                                            merkType:
                                                                first.merkType,
                                                            formaat:
                                                                first.formaat,
                                                        }
                                                    );
                                                }}
                                                className="text-xs font-semibold text-[#0066FF]"
                                            >
                                                Kopieer Merk &amp; Type van
                                                Scherm 1
                                            </button>
                                        ) : null}
                                    </div>

                                    <div>
                                        <span className="text-xs text-gray-600">
                                            Foto van scherm / typeplaatje
                                        </span>
                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <label className="inline-flex cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium bg-slate-50 hover:bg-slate-100">
                                                Maak foto / Upload
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file =
                                                            e.target.files?.[0];
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
                                            {scherm.fotoUrl ? (
                                                <a
                                                    href={scherm.fotoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs text-[#0066FF] underline"
                                                >
                                                    Foto bekijken
                                                </a>
                                            ) : null}
                                        </div>
                                    </div>

                                    <label className="block">
                                        <span className="text-xs text-gray-600">
                                            Formaat / Inch
                                        </span>
                                        <select
                                            value={scherm.formaat}
                                            onChange={(e) =>
                                                updateScherm(
                                                    ruimte.id,
                                                    scherm.id,
                                                    {
                                                        formaat: e.target.value,
                                                    }
                                                )
                                            }
                                            className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                                        >
                                            <option value="">Kies...</option>
                                            {SCHERM_FORMATEN.map((f) => (
                                                <option key={f} value={f}>
                                                    {f}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className="text-xs text-gray-600">
                                            Merk &amp; Type
                                        </span>
                                        <input
                                            value={scherm.merkType}
                                            onChange={(e) =>
                                                updateScherm(
                                                    ruimte.id,
                                                    scherm.id,
                                                    {
                                                        merkType: e.target.value,
                                                    }
                                                )
                                            }
                                            className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-xs text-gray-600">
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
                                                            e.target.value,
                                                    }
                                                )
                                            }
                                            className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                                            placeholder="Typ of plak serienummer"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-xs text-gray-600">
                                            MAC-adres
                                        </span>
                                        <input
                                            value={scherm.mac}
                                            onChange={(e) =>
                                                updateScherm(
                                                    ruimte.id,
                                                    scherm.id,
                                                    { mac: e.target.value }
                                                )
                                            }
                                            className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                                            placeholder="Typ of plak MAC-adres"
                                        />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Sectie 3 */}
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

            {/* Sectie 4 */}
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

            {/* Sectie 5 opmerkingen (bijlagen in parent) */}
            <label className="block">
                <span className="text-sm font-semibold text-gray-800">
                    Opmerkingen / notities
                </span>
                <textarea
                    rows={4}
                    value={opmerkingen}
                    onChange={(e) => onOpmerkingenChange(e.target.value)}
                    placeholder="Bijzonderheden, oplevernotities of afwijkingen"
                    className="w-full border rounded-xl p-3 mt-1"
                />
            </label>
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
            <div className="flex gap-2">
                {(["Ja", "Nee"] as const).map((optie) => (
                    <button
                        key={optie}
                        type="button"
                        onClick={() =>
                            onChange({
                                ...value,
                                aanwezig: value.aanwezig === optie ? "" : optie,
                                mdbRealiseert:
                                    optie === "Ja" ? "" : value.mdbRealiseert,
                            })
                        }
                        className={
                            "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                            +
                            (value.aanwezig === optie
                                ? optie === "Ja"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-white text-gray-700 border-gray-200")
                        }
                    >
                        {optie}
                    </button>
                ))}
            </div>

            {value.aanwezig === "Nee" ? (
                <div className="pl-3 border-l-2 border-amber-200 space-y-3">
                    <p className="text-sm text-gray-600">
                        Wil je dat MDB Networks dit realiseert?
                    </p>
                    <div className="flex gap-2">
                        {(["Ja", "Nee"] as const).map((optie) => (
                            <button
                                key={optie}
                                type="button"
                                onClick={() =>
                                    onChange({
                                        ...value,
                                        mdbRealiseert:
                                            value.mdbRealiseert === optie
                                                ? ""
                                                : optie,
                                    })
                                }
                                className={
                                    "flex-1 rounded-lg py-2 border-2 text-sm font-medium "
                                    +
                                    (value.mdbRealiseert === optie
                                        ? "bg-sky-100 text-sky-800 border-sky-300"
                                        : "bg-white text-gray-700 border-gray-200")
                                }
                            >
                                {optie === "Nee"
                                    ? "Nee (klant regelt dit zelf)"
                                    : "Ja"}
                            </button>
                        ))}
                    </div>

                    {value.mdbRealiseert === "Ja" ? (
                        <div className="space-y-3">
                            <label className="block">
                                <span className="text-xs text-gray-600">
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
                                    className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                                />
                            </label>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">
                                    Kabel traject
                                </p>
                                <Keuze
                                    options={trajectOpties.map((t) => ({
                                        value: t,
                                        label: t,
                                    }))}
                                    value={value.kabelTraject}
                                    onChange={(v) =>
                                        onChange({
                                            ...value,
                                            kabelTraject: v,
                                        })
                                    }
                                    columns={1}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
