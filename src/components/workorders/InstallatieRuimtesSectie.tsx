"use client";

import {
    AANSTURING_OPTIES,
    BEVESTIGING_OPTIES,
    PLAFOND_HOOGTE_OPTIES,
    SCHERM_FORMATEN,
    bevestigingDetails,
    isAansturingMetApparaat,
    isPlayerAansturing,
    normaliseerBevestiging,
} from "@/lib/aanvraag/installatieTypes";
import {
    actieVanWerkzaamheid,
    itemPastBijWerkzaamheid,
    werkzaamheidVanActie,
    type OpleverWerkzaamheid,
} from "@/lib/workorders/opleverModules";
import {
    InstallatieRuimte,
    InstallatieScherm,
    KABEL_TRAJECT_P25,
    StroomInternetBlok,
    emptyRuimte,
    joinMerkType,
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

function HardwareKenmerkenTabel({
    titel,
    merk,
    type,
    serienummer,
    mac,
    onChange,
}: {
    titel: string;
    merk: string;
    type: string;
    serienummer: string;
    mac: string;
    onChange: (patch: {
        merk?: string;
        type?: string;
        serienummer?: string;
        mac?: string;
    }) => void;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <p className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border-b border-slate-200">
                {titel}
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[28rem]">
                    <thead>
                        <tr className="bg-white">
                            <th className="border-b border-slate-200 p-2 text-left font-medium text-gray-600">
                                Merk
                            </th>
                            <th className="border-b border-slate-200 p-2 text-left font-medium text-gray-600">
                                Type
                            </th>
                            <th className="border-b border-slate-200 p-2 text-left font-medium text-gray-600">
                                Serienummer
                            </th>
                            <th className="border-b border-slate-200 p-2 text-left font-medium text-gray-600">
                                MAC-adres
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-1.5 align-top">
                                <input
                                    value={merk}
                                    onChange={(e) =>
                                        onChange({ merk: e.target.value })
                                    }
                                    placeholder="Merk"
                                    className="w-full border rounded-lg p-2 bg-white text-sm"
                                />
                            </td>
                            <td className="p-1.5 align-top">
                                <input
                                    value={type}
                                    onChange={(e) =>
                                        onChange({ type: e.target.value })
                                    }
                                    placeholder="Type"
                                    className="w-full border rounded-lg p-2 bg-white text-sm"
                                />
                            </td>
                            <td className="p-1.5 align-top">
                                <input
                                    value={serienummer}
                                    onChange={(e) =>
                                        onChange({
                                            serienummer: e.target.value,
                                        })
                                    }
                                    placeholder="Serienummer"
                                    className="w-full border rounded-lg p-2 bg-white text-sm"
                                />
                            </td>
                            <td className="p-1.5 align-top">
                                <input
                                    value={mac}
                                    onChange={(e) =>
                                        onChange({ mac: e.target.value })
                                    }
                                    onBlur={(e) =>
                                        onChange({
                                            mac: normalizeMac(e.target.value),
                                        })
                                    }
                                    placeholder="Optioneel"
                                    autoCapitalize="characters"
                                    spellCheck={false}
                                    className="w-full border rounded-lg p-2 bg-white text-sm"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
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
    opmerkingen?: string;
    onOpmerkingenChange?: (v: string) => void;
    showOpmerkingen?: boolean;
    uploadFile: (file: File) => Promise<{ url: string; name: string } | null>;
    werkzaamheid?: OpleverWerkzaamheid;
    actieveWerkzaamheden?: OpleverWerkzaamheid[];
}

export default function InstallatieRuimtesSectie({
    ruimtes,
    onRuimtesChange,
    werkzaamheid,
    actieveWerkzaamheden = [],
    opmerkingen = "",
    onOpmerkingenChange,
    showOpmerkingen = false,
}: Props) {
    const actieve =
        werkzaamheid
            ? (actieveWerkzaamheden.length > 0
                ? actieveWerkzaamheden
                : [werkzaamheid])
            : actieveWerkzaamheden;

    const zichtbareRuimtes =
        werkzaamheid
            ? ruimtes.filter((ruimte) =>
                itemPastBijWerkzaamheid(
                    werkzaamheidVanActie(ruimte.actie),
                    werkzaamheid,
                    actieve
                )
            )
            : ruimtes;

    function commit(nextVisible: InstallatieRuimte[]) {
        if (!werkzaamheid) {
            onRuimtesChange(nextVisible);
            return;
        }

        const rest = ruimtes.filter((ruimte) =>
            !itemPastBijWerkzaamheid(
                werkzaamheidVanActie(ruimte.actie),
                werkzaamheid,
                actieve
            )
        );
        const tagged = nextVisible.map((ruimte) => ({
            ...ruimte,
            actie: actieVanWerkzaamheid(werkzaamheid),
        }));
        onRuimtesChange([...rest, ...tagged]);
    }

    const schermKaarten = zichtbareRuimtes.flatMap((ruimte) =>
        ruimte.schermen.map((scherm) => ({
            ruimteId: ruimte.id,
            scherm,
        }))
    );

    const hardwareStatusLabel =
        werkzaamheid === "demontage" ? "gedemonteerd" : "geïnstalleerd";

    function updateScherm(
        ruimteId: string,
        schermId: string,
        patch: Partial<InstallatieScherm>
    ) {
        commit(
            zichtbareRuimtes.map((r) => {
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

    function patchSchermHardware(
        ruimteId: string,
        scherm: InstallatieScherm,
        patch: Partial<
            Pick<
                InstallatieScherm,
                | "merk"
                | "type"
                | "serienummer"
                | "mac"
                | "playerMerk"
                | "playerType"
                | "playerSerienummer"
                | "playerMac"
            >
        >
    ) {
        const next = { ...scherm, ...patch };
        updateScherm(ruimteId, scherm.id, {
            ...patch,
            merkType: joinMerkType(next.merk || "", next.type || ""),
            playerMerkType: joinMerkType(
                next.playerMerk || "",
                next.playerType || ""
            ),
        });
    }

    function addScherm() {
        if (zichtbareRuimtes.length === 0) {
            commit([emptyRuimte()]);
            return;
        }
        const last = zichtbareRuimtes[zichtbareRuimtes.length - 1];
        commit(
            zichtbareRuimtes.map((r) =>
                r.id === last.id
                    ? syncSchermen(r, r.aantalSchermen + 1)
                    : r
            )
        );
    }

    function removeScherm(ruimteId: string, schermId: string) {
        const next = zichtbareRuimtes
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

        commit(
            next.length > 0 || werkzaamheid
                ? next
                : [emptyRuimte()]
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-4">
                {schermKaarten.map(({ ruimteId, scherm }, index) => {
                    const detailOpties = bevestigingDetails(scherm.beugel);
                    const toonSchermTabel = Boolean(scherm.formaat);
                    const toonAansturingTabel = isAansturingMetApparaat(
                        scherm.aansturing
                    );
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

                            {toonSchermTabel ? (
                                <HardwareKenmerkenTabel
                                    titel={
                                        scherm.formaat === "Anders"
                                            ? `${scherm.formaatAnders || "Scherm"} — gegevens`
                                            : `${scherm.formaat} ${hardwareStatusLabel} — gegevens`
                                    }
                                    merk={scherm.merk || ""}
                                    type={scherm.type || ""}
                                    serienummer={scherm.serienummer || ""}
                                    mac={scherm.mac || ""}
                                    onChange={(patch) =>
                                        patchSchermHardware(
                                            ruimteId,
                                            scherm,
                                            patch
                                        )
                                    }
                                />
                            ) : null}

                            <div className="space-y-1.5">
                                <span className="text-xs text-gray-600">
                                    Bevestiging{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <select
                                    value={normaliseerBevestiging(scherm.beugel)}
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
                                            Type {normaliseerBevestiging(scherm.beugel).toLowerCase()}
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

                            {toonAansturingTabel ? (
                                <HardwareKenmerkenTabel
                                    titel={
                                        isPlayerAansturing(scherm.aansturing)
                                            ? "Aansturing (player)"
                                            : scherm.aansturing === "Anders"
                                              ? `Aansturing (${scherm.aansturingAnders || "anders"})`
                                              : `Aansturing (${scherm.aansturing})`
                                    }
                                    merk={scherm.playerMerk || ""}
                                    type={scherm.playerType || ""}
                                    serienummer={scherm.playerSerienummer || ""}
                                    mac={scherm.playerMac || ""}
                                    onChange={(patch) =>
                                        patchSchermHardware(ruimteId, scherm, {
                                            playerMerk: patch.merk,
                                            playerType: patch.type,
                                            playerSerienummer: patch.serienummer,
                                            playerMac: patch.mac,
                                        })
                                    }
                                />
                            ) : null}

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
                        </div>
                    );
                })}

                <button
                    type="button"
                    onClick={addScherm}
                    className="
                        w-full rounded-xl border-2 border-dashed border-[#0066FF]/40
                        py-3 text-sm font-semibold text-[#0066FF]
                        hover:bg-[#0066FF]/5
                    "
                >
                    + Scherm toevoegen
                </button>
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
