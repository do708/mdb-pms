"use client";

import {
    parseWerkInstructie,
    urlsUitTekst,
    type InstructieBlok,
} from "@/lib/werkInstructie/parseWerkInstructie";

function startFotoSleep(event: React.DragEvent, url: string) {
    event.dataTransfer.setData("text/uri-list", url);
    event.dataTransfer.setData("text/plain", url);
    event.dataTransfer.effectAllowed = "copy";
}

function FotoLinks({
    urls,
    onNaarFotos,
}: {
    urls: string[];
    onNaarFotos?: (url: string) => void;
}) {
    return (
        <ul className="space-y-1.5">
            {urls.map((url) => (
                <li key={url} className="flex items-start gap-2 min-w-0">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        draggable
                        onDragStart={(e) => startFotoSleep(e, url)}
                        className="
                            text-sm text-sky-700 underline break-all min-w-0
                            cursor-grab
                        "
                    >
                        {url}
                    </a>
                    {onNaarFotos ? (
                        <button
                            type="button"
                            onClick={() => onNaarFotos(url)}
                            className="
                                shrink-0 text-[11px] font-medium
                                text-[#0066FF] hover:underline
                            "
                        >
                            Naar foto&apos;s
                        </button>
                    ) : null}
                </li>
            ))}
        </ul>
    );
}

function BlokWeergave({
    blok,
    onNaarFotos,
}: {
    blok: InstructieBlok;
    onNaarFotos?: (url: string) => void;
}) {
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
            <p className="text-sm text-gray-800">
                <span className="font-semibold">{blok.label}: </span>
                {urls.length ? (
                    <FotoLinks urls={urls} onNaarFotos={onNaarFotos} />
                ) : (
                    <span className="whitespace-pre-wrap">{blok.waarde}</span>
                )}
            </p>
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
        return <FotoLinks urls={blok.urls} onNaarFotos={onNaarFotos} />;
    }

    const urls = urlsUitTekst(blok.tekst);
    if (urls.length === 0) {
        return (
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {blok.tekst}
            </p>
        );
    }

    const delen = blok.tekst.split(/(https?:\/\/[^\s<>"'()]+)/gi);
    return (
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {delen.map((deel, i) => {
                if (/^https?:\/\//i.test(deel)) {
                    const url = deel.replace(/[.,;:]+$/g, "");
                    return (
                        <a
                            key={`${url}-${i}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            draggable
                            onDragStart={(e) => startFotoSleep(e, url)}
                            className="text-sky-700 underline break-all cursor-grab"
                        >
                            {url}
                        </a>
                    );
                }
                return <span key={i}>{deel}</span>;
            })}
        </p>
    );
}

export default function WerkInstructieWeergave({
    tekst,
    onNaarFotos,
}: {
    tekst: string;
    onNaarFotos?: (url: string) => void;
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
                <BlokWeergave
                    key={index}
                    blok={blok}
                    onNaarFotos={onNaarFotos}
                />
            ))}
            {onNaarFotos ? (
                <p className="text-[11px] text-gray-500">
                    Fotolinks kun je naar Foto&apos;s slepen of via
                    &quot;Naar foto&apos;s&quot; toevoegen.
                </p>
            ) : null}
        </div>
    );
}
