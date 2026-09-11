"use client";

import type { ReactNode } from "react";
import {
    berekendInstallatieType,
    formaatWeergaveScherm,
    installatieTypeWeergave,
    isHoofdType,
    schermBeugelArtikelen,
    type AanvraagSchermItem,
    type BeugelArtikelKolom,
    type BenodigdeBeugelRij,
} from "@/lib/aanvraag/installatieTypes";

export type BeugelkeuzeSchermRij = {
    key: string;
    scherm: string;
    formaat: string;
    artikelen: BeugelArtikelKolom[];
    typeLabel: string;
    rol: string;
    opmerking: string;
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
        artikelen: schermBeugelArtikelen(item),
        typeLabel: installatieTypeWeergave(typeCode),
        rol: typeCode
            ? isHoofdType(item, alle)
                ? "hoofdtype"
                : "vervolg"
            : "",
        opmerking:
            naastIndex >= 0
                ? `${item.monterenKoppeling === "b2b" ? "b2b" : "naast"} scherm ${naastIndex + 1}`
                : "",
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
    return (
        <div className="min-w-0 overflow-hidden rounded-sm border border-[#9BB7D4] bg-white shadow-sm">
            <p className="bg-[#D6007E] px-2 py-1.5 text-center text-xs font-bold tracking-wide text-white">
                {titel}
            </p>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-[#0066FF] text-white">
                            {kolommen.map((k) => (
                                <th
                                    key={k}
                                    className="whitespace-nowrap border border-[#2E6FE0] px-2 py-1 text-left font-semibold"
                                >
                                    {k}
                                    <span
                                        className="ml-1 text-[9px] opacity-75"
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
    return index % 2 === 1 ? "bg-[#DCE6F7]" : "bg-white";
}

export default function BeugelkeuzeOverzicht({
    schermen,
    beugels,
    leegHint,
}: {
    schermen: BeugelkeuzeSchermRij[];
    beugels: BenodigdeBeugelRij[];
    leegHint?: string;
}) {
    if (schermen.length === 0) return null;

    return (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,1fr)]">
            <ExcelTabel
                titel="Overzicht types"
                kolommen={["Scherm", "Formaat", "Artikel", "Beugel", "Type"]}
            >
                {schermen.map((s, i) => (
                    <tr key={s.key} className={rijKleur(i)}>
                        <td className="whitespace-nowrap border border-[#C5D4E8] px-2 py-1 font-semibold text-[#1F4E79]">
                            {s.scherm}
                        </td>
                        <td className="whitespace-nowrap border border-[#C5D4E8] px-2 py-1 text-gray-800">
                            {s.formaat || "—"}
                        </td>
                        <td className="whitespace-nowrap border border-[#C5D4E8] px-2 py-1 font-medium text-[#1F4E79]">
                            <ArtikelRegels
                                artikelen={s.artikelen}
                                veld="artikel"
                            />
                        </td>
                        <td className="border border-[#C5D4E8] px-2 py-1 text-gray-800">
                            <ArtikelRegels
                                artikelen={s.artikelen}
                                veld="naam"
                            />
                        </td>
                        <td className="border border-[#C5D4E8] px-2 py-1 text-gray-800">
                            <p className="font-semibold leading-tight text-[#0066FF]">
                                {s.typeLabel}
                            </p>
                            {s.rol ? (
                                <p className="leading-tight text-gray-600">
                                    {s.rol}
                                </p>
                            ) : null}
                            {s.opmerking ? (
                                <p className="leading-tight text-gray-500">
                                    {s.opmerking}
                                </p>
                            ) : null}
                        </td>
                    </tr>
                ))}
            </ExcelTabel>

            {beugels.length > 0 ? (
                <ExcelTabel
                    titel="Benodigde beugels"
                    kolommen={["Aantal", "Artikel", "Naam"]}
                >
                    {beugels.map((rij, i) => (
                        <tr key={rij.label} className={rijKleur(i)}>
                            <td className="whitespace-nowrap border border-[#C5D4E8] px-2 py-1 font-semibold tabular-nums text-[#1F4E79]">
                                {rij.aantal}×
                            </td>
                            <td className="whitespace-nowrap border border-[#C5D4E8] px-2 py-1 font-medium text-[#1F4E79]">
                                {rij.artikel || "—"}
                            </td>
                            <td className="border border-[#C5D4E8] px-2 py-1 text-gray-800">
                                {rij.naam || rij.label}
                            </td>
                        </tr>
                    ))}
                </ExcelTabel>
            ) : leegHint ? (
                <p className="self-start rounded-sm border border-[#C5D4E8] bg-white px-3 py-2 text-xs text-gray-500">
                    {leegHint}
                </p>
            ) : null}
        </div>
    );
}
