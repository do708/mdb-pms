"use client";

import type { ReactNode } from "react";
import {
    beugelArtikelenTekst,
    beugelTypeWeergave,
    berekendInstallatieType,
    formaatWeergaveScherm,
    installatieTypeWeergave,
    isHoofdType,
    schermBeugelArtikelen,
    type AanvraagSchermItem,
} from "@/lib/aanvraag/installatieTypes";

export type BeugelkeuzeSchermRij = {
    key: string;
    scherm: string;
    formaat: string;
    installatie: string;
    advies: string;
    override: string | null;
    typeLabel: string;
    plaatsing: string;
};

export function naarBeugelkeuzeSchermRij(
    item: AanvraagSchermItem,
    alle: AanvraagSchermItem[],
    index: number,
    opgeslagenType?: string | null
): BeugelkeuzeSchermRij {
    const typeCode =
        (opgeslagenType || "").trim() ||
        berekendInstallatieType(item, alle);
    const naastIndex = item.naastSchermId
        ? alle.findIndex((x) => x.id === item.naastSchermId)
        : -1;

    return {
        key: item.id || String(index),
        scherm: `Scherm ${index + 1}`,
        formaat: formaatWeergaveScherm(item),
        installatie: beugelTypeWeergave(item),
        advies: beugelArtikelenTekst(schermBeugelArtikelen(item, alle)),
        override:
            typeof item.beugelAdvies === "string" ? item.beugelAdvies : null,
        typeLabel: installatieTypeWeergave(typeCode),
        plaatsing: typeCode
            ? isHoofdType(item, alle)
                ? "Hoofdinstallatie"
                : naastIndex >= 0
                    ? `Vervolginstallatie (${item.monterenKoppeling === "b2b" ? "back-to-back met" : "naast"} scherm ${naastIndex + 1})`
                    : "Vervolginstallatie"
            : "—",
    };
}

function ExcelTabel({
    titel,
    kolommen,
    children,
}: {
    titel: string;
    kolommen: string[];
    children: ReactNode;
}) {
    const kopKleuren = [
        "bg-[#DCEAF7] text-[#244968]",
        "bg-[#E7F0FA] text-[#244968]",
        "bg-[#DDF0EC] text-[#285A50]",
        "bg-[#E8F4E8] text-[#31583B]",
        "bg-[#EEE7F6] text-[#523E68]",
        "bg-[#F5E8F1] text-[#70435C]",
        "bg-[#F8EEDB] text-[#69552D]",
    ];

    return (
        <div className="min-w-0 overflow-hidden rounded-sm border border-[#9BB7D4] bg-white shadow-sm">
            <p className="bg-[#D6007E] px-2 py-1.5 text-center text-xs font-bold tracking-wide text-white">
                {titel}
            </p>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] table-fixed border-collapse text-xs lg:min-w-0">
                    <thead>
                        <tr>
                            {kolommen.map((k, i) => (
                                <th
                                    key={k}
                                    className={`whitespace-nowrap border border-[#B8C9D8] px-2 py-1 text-left font-semibold ${kopKleuren[i] || kopKleuren[0]}`}
                                >
                                    {k}
                                    <span
                                        className="ml-1 text-[9px] opacity-60"
                                        aria-hidden
                                    >
                                        ▾
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>{children}</tbody>
                </table>
            </div>
        </div>
    );
}

function rijKleur(index: number): string {
    return index % 2 === 1 ? "bg-[#F4F7FA]" : "bg-[#FCFDFE]";
}

function GeadviseerdeBeugelsVeld({
    advies,
    override,
    onChange,
}: {
    advies: string;
    override: string | null;
    onChange?: (value: string | null) => void;
}) {
    const eigenTekst = override !== null;
    const waarde = eigenTekst ? override : advies;

    if (!onChange) {
        return waarde ? (
            <p className="leading-tight">{waarde}</p>
        ) : (
            <span className="text-gray-400">—</span>
        );
    }

    const toonKruis = eigenTekst || Boolean(waarde);

    return (
        <div className="relative min-w-0 pt-3">
            {toonKruis ? (
                <button
                    type="button"
                    onClick={() => onChange(eigenTekst ? null : "")}
                    title={eigenTekst ? "Terug naar advies" : "Wissen"}
                    aria-label={eigenTekst ? "Terug naar advies" : "Wissen"}
                    className="absolute top-0 right-0 z-10 text-slate-400 hover:text-red-500 text-base leading-none px-0.5"
                >
                    ×
                </button>
            ) : null}
            <textarea
                value={waarde}
                rows={2}
                onChange={(e) => onChange(e.target.value)}
                placeholder={advies || "Geen advies — zelf invullen"}
                className="w-full min-h-[2.5rem] resize-y rounded border border-[#C5D4E8] bg-white px-1.5 py-1 text-xs text-gray-900 leading-tight"
            />
        </div>
    );
}

export default function BeugelkeuzeOverzicht({
    schermen,
    onBeugelAdviesChange,
}: {
    schermen: BeugelkeuzeSchermRij[];
    onBeugelAdviesChange?: (key: string, value: string | null) => void;
}) {
    if (schermen.length === 0) return null;

    return (
        <div className="min-w-0">
            <ExcelTabel
                titel="Overzicht types"
                kolommen={[
                    "Scherm",
                    "Formaat",
                    "Installatie",
                    "Geadviseerde beugels",
                    "Type",
                    "Plaatsing",
                ]}
            >
                {schermen.map((s, i) => (
                    <tr key={s.key} className={rijKleur(i)}>
                        <td className="whitespace-nowrap border border-[#C5D4E8] bg-[#EAF2FA]/70 px-2 py-1 font-semibold text-[#1F4E79]">
                            {s.scherm}
                        </td>
                        <td className="whitespace-nowrap border border-[#C5D4E8] bg-[#F1F6FB]/60 px-2 py-1 text-gray-800">
                            {s.formaat || "—"}
                        </td>
                        <td className="border border-[#C5D4E8] bg-[#ECF6F2]/60 px-2 py-1 text-gray-800">
                            {s.installatie || "—"}
                        </td>
                        <td className="border border-[#C5D4E8] bg-[#F1F8F0]/60 px-2 py-1 font-medium text-[#1F4E79] align-top">
                            <GeadviseerdeBeugelsVeld
                                advies={s.advies}
                                override={s.override}
                                onChange={
                                    onBeugelAdviesChange
                                        ? (value) =>
                                              onBeugelAdviesChange(s.key, value)
                                        : undefined
                                }
                            />
                        </td>
                        <td className="border border-[#C5D4E8] bg-[#FAF0F6]/60 px-2 py-1 text-gray-800">
                            <span className="font-semibold text-[#8A3564]">
                                {s.typeLabel}
                            </span>
                        </td>
                        <td className="border border-[#C5D4E8] bg-[#FBF5E8]/60 px-2 py-1 text-gray-800">
                            {s.plaatsing}
                        </td>
                    </tr>
                ))}
            </ExcelTabel>
        </div>
    );
}
