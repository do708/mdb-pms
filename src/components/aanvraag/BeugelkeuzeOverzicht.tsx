"use client";

import type { ReactNode } from "react";
import {
    beugelTypeWeergave,
    berekendInstallatieType,
    formaatWeergaveScherm,
    installatieTypeWeergave,
    isHoofdType,
    schermBeugelArtikelen,
    type AanvraagSchermItem,
    type BeugelArtikelKolom,
} from "@/lib/aanvraag/installatieTypes";

export type BeugelkeuzeSchermRij = {
    key: string;
    scherm: string;
    formaat: string;
    installatie: string;
    artikelen: BeugelArtikelKolom[];
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
        artikelen: schermBeugelArtikelen(item),
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

function ArtikelRegels({
    artikelen,
    veld,
}: {
    artikelen: BeugelArtikelKolom[];
    veld: "artikel" | "naam";
}) {
    if (artikelen.length === 0) {
        return <span className="text-gray-400">—</span>;
    }
    return (
        <div className="space-y-0.5">
            {artikelen.map((a, i) => {
                const tekst =
                    veld === "artikel"
                        ? a.artikel
                            ? `${a.aantal}× ${a.artikel}`
                            : "—"
                        : a.naam || "—";
                return (
                    <p key={`${veld}-${i}`} className="leading-tight">
                        {tekst}
                    </p>
                );
            })}
        </div>
    );
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

export default function BeugelkeuzeOverzicht({
    schermen,
}: {
    schermen: BeugelkeuzeSchermRij[];
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
                    "Artikel",
                    "Beugel",
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
                        <td className="border border-[#C5D4E8] bg-[#F1F8F0]/60 px-2 py-1 font-medium text-[#1F4E79]">
                            <ArtikelRegels
                                artikelen={s.artikelen}
                                veld="artikel"
                            />
                        </td>
                        <td className="border border-[#C5D4E8] bg-[#F5F0FA]/60 px-2 py-1 text-gray-800">
                            <ArtikelRegels
                                artikelen={s.artikelen}
                                veld="naam"
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
