"use client";

import { AUDIO_KABEL_TRAJECT_OPTIES } from "@/lib/aanvraag/installatieTypes";
import {
    JaNee,
    MdbRealisatieVervolg,
} from "@/components/aanvraag/StroomInternetVragen";

interface Props {
    velden: Record<string, string>;
    onChange: (veld: string, waarde: string) => void;
    onPatch: (patch: Record<string, string>) => void;
}

export default function AudioSpecificatie({
    velden,
    onChange,
    onPatch,
}: Props) {
    const kabelNodig = (velden.kabelNodig || "") as
        | ""
        | "Ja"
        | "Nee";

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <label className="block flex-1 min-w-[120px]">
                    <span className="text-xs text-gray-600">
                        Aantal speakers
                    </span>
                    <input
                        value={velden.speakersAantal || ""}
                        onChange={(e) =>
                            onChange(
                                "speakersAantal",
                                e.target.value
                            )
                        }
                        placeholder="Bijv. 4"
                        className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                    />
                </label>
                <label className="block flex-1 min-w-[140px]">
                    <span className="text-xs text-gray-600">
                        Type speakers
                    </span>
                    <input
                        value={velden.speakersType || ""}
                        onChange={(e) =>
                            onChange(
                                "speakersType",
                                e.target.value
                            )
                        }
                        placeholder="Bijv. plafond"
                        className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                    />
                </label>
            </div>

            <label className="block">
                <span className="text-xs text-gray-600">
                    Versterker
                </span>
                <input
                    value={velden.versterker || ""}
                    onChange={(e) =>
                        onChange("versterker", e.target.value)
                    }
                    placeholder="Bijv. 1x versterker"
                    className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                />
            </label>

            <label className="block">
                <span className="text-xs text-gray-600">
                    Oppervlakte ruimte (m²)
                </span>
                <input
                    value={velden.ruimteM2 || ""}
                    onChange={(e) =>
                        onChange("ruimteM2", e.target.value)
                    }
                    placeholder="Bijv. 80"
                    className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                />
            </label>

            <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="text-xs text-gray-600 block">
                    Moet er nieuwe luidsprekerkabel getrokken
                    worden?
                </span>
                <JaNee
                    value={
                        kabelNodig === "Ja"
                        || kabelNodig === "Nee"
                            ? kabelNodig
                            : ""
                    }
                    onChange={(v) => {
                        onPatch({
                            kabelNodig: v,
                            kabelMdb: "",
                            kabelAfstand: "",
                            kabelTraject: "",
                        });
                    }}
                />
                {kabelNodig === "Ja" ? (
                    <MdbRealisatieVervolg
                        mdb={velden.kabelMdb || ""}
                        afstand={velden.kabelAfstand || ""}
                        traject={velden.kabelTraject || ""}
                        trajectOpties={AUDIO_KABEL_TRAJECT_OPTIES}
                        onMdbChange={(v) => {
                            onPatch({
                                kabelMdb: v,
                                kabelAfstand: "",
                                kabelTraject: "",
                            });
                        }}
                        onAfstandChange={(v) =>
                            onChange("kabelAfstand", v)
                        }
                        onTrajectChange={(v) =>
                            onChange("kabelTraject", v)
                        }
                    />
                ) : null}
            </div>

            <label className="block">
                <span className="text-xs text-gray-600">
                    Opmerking
                </span>
                <input
                    value={velden.opmerking || ""}
                    onChange={(e) =>
                        onChange("opmerking", e.target.value)
                    }
                    placeholder="Aanvullende details"
                    className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                />
            </label>
        </div>
    );
}
