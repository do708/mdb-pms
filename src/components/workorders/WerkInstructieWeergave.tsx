"use client";

import { useState } from "react";

import {
    parseWerkInstructie,
    urlsUitTekst,
    type InstructieBlok,
} from "@/lib/werkInstructie/parseWerkInstructie";

function InstructieFoto({ url }: { url: string }) {
    const [kapot, setKapot] = useState(false);

    if (kapot) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-700 underline break-all"
            >
                {url}
            </a>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-indigo-100 bg-white overflow-hidden"
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt="Setup-foto"
                className="w-full max-h-48 object-contain bg-white"
                onError={() => setKapot(true)}
            />
        </a>
    );
}

function InstructieFotos({ urls }: { urls: string[] }) {
    if (urls.length === 0) {
        return null;
    }

    return (
        <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-indigo-800">
                Foto&apos;s vooraf — ter informatie
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {urls.map((url) => (
                    <InstructieFoto key={url} url={url} />
                ))}
            </div>
        </div>
    );
}

function BlokWeergave({ blok }: { blok: InstructieBlok }) {
    if (blok.soort === "kop") {
        return (
            <h3 className="text-sm font-bold text-gray-900 pt-1">
                {blok.tekst}
            </h3>
        );
    }

    if (blok.soort === "regel") {
        const urls = urlsUitTekst(blok.waarde);
        return (
            <div className="space-y-1.5">
                <p className="text-sm text-gray-800">
                    <span className="font-semibold">{blok.label}: </span>
                    {urls.length === 0 ? (
                        <span className="whitespace-pre-wrap">{blok.waarde}</span>
                    ) : null}
                </p>
                <InstructieFotos urls={urls} />
            </div>
        );
    }

    if (blok.soort === "tabel") {
        return (
            <div className="overflow-x-auto -mx-1">
                <table className="min-w-full text-xs sm:text-sm border-collapse">
                    <thead>
                        <tr>
                            {blok.koppen.map((kop) => (
                                <th
                                    key={kop}
                                    className="
                                        text-left font-semibold text-gray-700
                                        border-b border-indigo-200 px-2 py-1.5
                                        whitespace-nowrap
                                    "
                                >
                                    {kop}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {blok.rijen.map((rij, ri) => (
                            <tr key={ri} className="align-top">
                                {rij.map((cel, ci) => (
                                    <td
                                        key={`${ri}-${ci}`}
                                        className="
                                            border-b border-indigo-100 px-2 py-1.5
                                            text-gray-900
                                        "
                                    >
                                        {cel}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (blok.soort === "links") {
        return <InstructieFotos urls={blok.urls} />;
    }

    const urls = urlsUitTekst(blok.tekst);
    if (urls.length === 0) {
        return (
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {blok.tekst}
            </p>
        );
    }

    const rest = blok.tekst
        .replace(/https?:\/\/[^\s<>"'()]+/gi, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    return (
        <div className="space-y-1.5">
            {rest ? (
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {rest}
                </p>
            ) : null}
            <InstructieFotos urls={urls} />
        </div>
    );
}

export default function WerkInstructieWeergave({
    tekst,
}: {
    tekst: string;
}) {
    const blokken = parseWerkInstructie(tekst);

    if (blokken.length === 0) {
        return (
            <p className="text-sm text-gray-500">Geen werkinstructie.</p>
        );
    }

    return (
        <div className="space-y-3">
            {blokken.map((blok, index) => (
                <BlokWeergave key={index} blok={blok} />
            ))}
        </div>
    );
}
