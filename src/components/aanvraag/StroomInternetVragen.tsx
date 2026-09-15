"use client";

import {
    CHIP_SELECTED_TONE,
    chipIdleClassName,
    chipSelectedClassName,
} from "@/components/ui/SpecLayout";
import {
    KABEL_TRAJECT_OPTIES,
    parseKabelTrajectKeuzes,
    toggleKabelTrajectKeuze,
} from "@/lib/aanvraag/installatieTypes";

export function JaNee({
    value,
    onChange,
    disabled = false,
}: {
    value: "" | "Ja" | "Nee";
    onChange: (v: "" | "Ja" | "Nee") => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex gap-2">
            {(["Ja", "Nee"] as const).map((optie) => (
                <button
                    key={optie}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                        onChange(value === optie ? "" : optie)
                    }
                    className={
                        "flex-1 rounded-lg py-2 border-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed "
                        +
                        (value === optie
                            ? optie === "Ja"
                                ? CHIP_SELECTED_TONE.green
                                : CHIP_SELECTED_TONE.orange
                            : chipIdleClassName)
                    }
                >
                    {optie}
                </button>
            ))}
        </div>
    );
}

const INTERNET_OPTIES = ["Ja", "Wifi", "Nee"] as const;
export type InternetAanwezig = "" | (typeof INTERNET_OPTIES)[number];

const INTERNET_ACTIEF: Record<
    Exclude<InternetAanwezig, "">,
    string
> = {
    Ja: CHIP_SELECTED_TONE.green,
    Wifi: CHIP_SELECTED_TONE.orange,
    Nee: CHIP_SELECTED_TONE.red,
};

/** Ja / Wifi / Nee voor “Internet aanwezig…?”. */
export function JaWifiNee({
    value,
    onChange,
    disabled = false,
}: {
    value: InternetAanwezig;
    onChange: (v: InternetAanwezig) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex gap-2">
            {INTERNET_OPTIES.map((optie) => (
                <button
                    key={optie}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                        onChange(value === optie ? "" : optie)
                    }
                    className={
                        "flex-1 rounded-lg py-2 border-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed "
                        +
                        (value === optie
                            ? INTERNET_ACTIEF[optie]
                            : chipIdleClassName)
                    }
                >
                    {optie}
                </button>
            ))}
        </div>
    );
}

export function MdbRealisatieVervolg({
    mdb,
    afstand,
    traject,
    onMdbChange,
    onAfstandChange,
    onTrajectChange,
    disabled = false,
    trajectOpties = KABEL_TRAJECT_OPTIES,
    trajectMultiSelect = false,
}: {
    mdb: string;
    afstand: string;
    traject: string;
    onMdbChange: (v: "" | "Ja" | "Nee") => void;
    onAfstandChange: (v: string) => void;
    onTrajectChange: (v: string) => void;
    disabled?: boolean;
    trajectOpties?: readonly string[];
    trajectMultiSelect?: boolean;
}) {
    const geselecteerdeTrajecten = trajectMultiSelect
        ? parseKabelTrajectKeuzes(traject)
        : [traject];

    return (
        <div className="pl-2 border-l-2 border-amber-200 space-y-2">
            <span className="text-xs text-gray-600 block">
                Wil je dat MDB Networks dit realiseert?
            </span>
            <JaNee
                value={
                    mdb === "Ja" || mdb === "Nee" ? mdb : ""
                }
                onChange={onMdbChange}
                disabled={disabled}
            />
            {mdb === "Ja" ? (
                <div className="space-y-2 pt-1">
                    <label className="block">
                        <span className="text-xs text-gray-600">
                            Geschatte afstand (meters)
                        </span>
                        <input
                            value={afstand}
                            disabled={disabled}
                            onChange={(e) =>
                                onAfstandChange(e.target.value)
                            }
                            placeholder="Bijv. 8"
                            className="w-full border rounded-lg p-2 mt-0.5 bg-white text-sm disabled:bg-slate-50 disabled:text-gray-500"
                        />
                    </label>
                    <div className="space-y-1.5">
                        <span className="text-xs text-gray-600 block">
                            Traject
                        </span>
                        <div className="flex flex-col gap-2">
                            {trajectOpties.map((optie) => (
                                <button
                                    key={optie}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() =>
                                        onTrajectChange(
                                            trajectMultiSelect
                                                ? toggleKabelTrajectKeuze(
                                                      traject,
                                                      optie,
                                                      trajectOpties
                                                  )
                                                : traject === optie
                                                  ? ""
                                                  : optie
                                        )
                                    }
                                    className={
                                        "w-full rounded-lg px-3 py-2 border-2 text-sm font-medium text-left disabled:opacity-60 disabled:cursor-not-allowed "
                                        +
                                        (geselecteerdeTrajecten.includes(optie)
                                            ? chipSelectedClassName
                                            : chipIdleClassName)
                                    }
                                >
                                    {optie}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

/** Stroom + internet/data met MDB-vervolgpatroon (gedeeld door schermen, videowall, kiosk, mediaplayers). */
export function StroomInternetVragen({
    velden,
    onChange,
    internetLabel = "Internet aanwezig binnen 3 meter?",
}: {
    velden: Record<string, string>;
    /** Enkele veld-update of patch van meerdere velden tegelijk. */
    onChange: (veldOrPatch: string | Record<string, string>, waarde?: string) => void;
    internetLabel?: string;
}) {
    const stroom = (velden.stroom || "") as "" | "Ja" | "Nee";
    const internetRaw = velden.internet || "";
    const internet: InternetAanwezig =
        internetRaw === "Ja" || internetRaw === "Wifi" || internetRaw === "Nee"
            ? internetRaw
            : "";

    function zet(veld: string, waarde: string) {
        onChange(veld, waarde);
    }

    function zetPatch(patch: Record<string, string>) {
        onChange(patch);
    }

    return (
        <div className="space-y-3 pt-1">
            <div className="space-y-2">
                <span className="text-xs text-gray-600 block">
                    Stroom aanwezig binnen 3 meter?
                </span>
                <JaNee
                    value={stroom === "Ja" || stroom === "Nee" ? stroom : ""}
                    onChange={(v) => {
                        zetPatch({
                            stroom: v,
                            stroomMdb: "",
                            stroomAfstand: "",
                            stroomTraject: "",
                        });
                    }}
                />
                {stroom === "Nee" ? (
                    <MdbRealisatieVervolg
                        mdb={velden.stroomMdb || ""}
                        afstand={velden.stroomAfstand || ""}
                        traject={velden.stroomTraject || ""}
                        onMdbChange={(v) => {
                            zetPatch({
                                stroomMdb: v,
                                stroomAfstand: "",
                                stroomTraject: "",
                            });
                        }}
                        onAfstandChange={(v) => zet("stroomAfstand", v)}
                        onTrajectChange={(v) => zet("stroomTraject", v)}
                    />
                ) : null}
            </div>

            <div className="space-y-2">
                <span className="text-xs text-gray-600 block">
                    {internetLabel}
                </span>
                <JaWifiNee
                    value={internet}
                    onChange={(v) => {
                        zetPatch({
                            internet: v,
                            internetMdb: "",
                            internetAfstand: "",
                            internetTraject: "",
                        });
                    }}
                />
                {internet === "Nee" ? (
                    <MdbRealisatieVervolg
                        mdb={velden.internetMdb || ""}
                        afstand={velden.internetAfstand || ""}
                        traject={velden.internetTraject || ""}
                        onMdbChange={(v) => {
                            zetPatch({
                                internetMdb: v,
                                internetAfstand: "",
                                internetTraject: "",
                            });
                        }}
                        onAfstandChange={(v) => zet("internetAfstand", v)}
                        onTrajectChange={(v) => zet("internetTraject", v)}
                    />
                ) : null}
            </div>
        </div>
    );
}
