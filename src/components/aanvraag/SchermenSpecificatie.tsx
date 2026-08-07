"use client";

import {
    AanvraagSchermItem,
    BEVESTIGING_DETAIL,
    BEVESTIGING_OPTIES,
    BevestigingSoort,
    FORMAAT_PASTEL,
    SCHERM_FORMATEN,
    berekendInstallatieType,
    isHoofdType,
    syncSchermItems,
} from "@/lib/aanvraag/installatieTypes";

function JaNee({
    value,
    onChange,
}: {
    value: "" | "Ja" | "Nee";
    onChange: (v: "" | "Ja" | "Nee") => void;
}) {
    return (
        <div className="flex gap-2">
            {(["Ja", "Nee"] as const).map((optie) => (
                <button
                    key={optie}
                    type="button"
                    onClick={() =>
                        onChange(value === optie ? "" : optie)
                    }
                    className={
                        "flex-1 rounded-lg py-2 border-2 text-sm font-medium "
                        +
                        (value === optie
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
    );
}

interface Props {
    aantal: string;
    onAantalChange: (aantal: string) => void;
    items: AanvraagSchermItem[];
    onItemsChange: (items: AanvraagSchermItem[]) => void;
}

export default function SchermenSpecificatie({
    aantal,
    onAantalChange,
    items,
    onItemsChange,
}: Props) {
    function zetAantal(raw: string) {
        onAantalChange(raw);
        const n = parseInt(raw, 10);

        if (!Number.isFinite(n) || n < 0) {
            onItemsChange([]);
            return;
        }

        onItemsChange(syncSchermItems(items, n));
    }

    function updateItem(
        id: string,
        patch: Partial<AanvraagSchermItem>
    ) {
        onItemsChange(
            items.map((s) => (s.id === id ? { ...s, ...patch } : s))
        );
    }

    return (
        <div className="space-y-4">
            <label className="block">
                <span className="text-xs text-gray-600">
                    Aantal schermen
                </span>
                <input
                    type="number"
                    min={0}
                    max={20}
                    value={aantal}
                    onChange={(e) => zetAantal(e.target.value)}
                    placeholder="Bijv. 2"
                    className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                />
            </label>

            {items.length > 0 ? (
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                        Vul per scherm formaat, bevestiging, oriëntatie en
                        locatie in. Op dezelfde locatie geldt altijd het{" "}
                        <span className="font-semibold">
                            grootste scherm
                        </span>{" "}
                        als hoofdtype; de overige schermen op die
                        locatie zijn vervolgtypes (
                        <span className="font-semibold">v</span>).
                    </p>

                    {items.map((scherm, index) => {
                        const type = berekendInstallatieType(
                            scherm,
                            items
                        );
                        const pastel =
                            FORMAAT_PASTEL[scherm.formaat] || {
                                bg: "bg-slate-100",
                                border: "border-slate-300",
                                text: "text-slate-800",
                            };
                        const detailOpties =
                            scherm.beugel &&
                            scherm.beugel in BEVESTIGING_DETAIL
                                ? BEVESTIGING_DETAIL[
                                      scherm.beugel as BevestigingSoort
                                  ]
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
                                    {type ? (
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/30">
                                            Type {type}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">
                                            Type —
                                        </span>
                                    )}
                                </div>

                                {index > 0 ? (
                                    <label className="block">
                                        <span className="text-xs text-gray-600">
                                            Dit scherm monteren naast
                                        </span>
                                        <select
                                            value={
                                                scherm.naastSchermId ||
                                                "__geen__"
                                            }
                                            onChange={(e) => {
                                                const value =
                                                    e.target.value;

                                                if (
                                                    value ===
                                                    "__geen__"
                                                ) {
                                                    updateItem(
                                                        scherm.id,
                                                        {
                                                            naastSchermId:
                                                                "",
                                                        }
                                                    );
                                                    return;
                                                }

                                                const anker =
                                                    items.find(
                                                        (s) =>
                                                            s.id ===
                                                            value
                                                    );

                                                updateItem(
                                                    scherm.id,
                                                    {
                                                        naastSchermId:
                                                            value,
                                                        locatie:
                                                            anker?.locatie ||
                                                            scherm.locatie,
                                                    }
                                                );
                                            }}
                                            className="w-full border rounded-lg p-2 mt-0.5 bg-white text-sm"
                                        >
                                            {items
                                                .map((s, si) =>
                                                    s.id ===
                                                    scherm.id
                                                        ? null
                                                        : (
                                                              <option
                                                                  key={
                                                                      s.id
                                                                  }
                                                                  value={
                                                                      s.id
                                                                  }
                                                              >
                                                                  Scherm{" "}
                                                                  {si +
                                                                      1}
                                                                  {s.locatie
                                                                      ? ` (${s.locatie})`
                                                                      : ""}
                                                              </option>
                                                          )
                                                )
                                                .filter(Boolean)}
                                            <option value="__geen__">
                                                Geen — aparte locatie
                                            </option>
                                        </select>
                                    </label>
                                ) : null}

                                <div className="space-y-1.5">
                                    <span className="text-xs text-gray-600">
                                        Formaat / inch
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {SCHERM_FORMATEN.map((f) => {
                                            const c =
                                                FORMAAT_PASTEL[f];
                                            const selected =
                                                scherm.formaat === f;

                                            return (
                                                <button
                                                    key={f}
                                                    type="button"
                                                    onClick={() =>
                                                        updateItem(
                                                            scherm.id,
                                                            {
                                                                formaat:
                                                                    selected
                                                                        ? ""
                                                                        : f,
                                                                formaatAnders:
                                                                    "",
                                                            }
                                                        )
                                                    }
                                                    className={
                                                        "rounded-lg px-3 py-2 border-2 text-sm font-medium "
                                                        +
                                                        (selected
                                                            ? `${c.bg} ${c.border} ${c.text}`
                                                            : "bg-white text-gray-600 border-gray-200")
                                                    }
                                                >
                                                    {f}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {scherm.formaat ? (
                                        <p
                                            className={`text-xs ${pastel.text}`}
                                        >
                                            Gekozen: {scherm.formaat}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-xs text-gray-600">
                                        Bevestiging
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {BEVESTIGING_OPTIES.map(
                                            (b) => (
                                                <button
                                                    key={b}
                                                    type="button"
                                                    onClick={() =>
                                                        updateItem(
                                                            scherm.id,
                                                            {
                                                                beugel:
                                                                    scherm.beugel ===
                                                                    b
                                                                        ? ""
                                                                        : b,
                                                                bevestigingDetail:
                                                                    "",
                                                            }
                                                        )
                                                    }
                                                    className={
                                                        "rounded-lg px-3 py-2 border-2 text-sm font-medium "
                                                        +
                                                        (scherm.beugel ===
                                                        b
                                                            ? "bg-sky-100 text-sky-900 border-sky-300"
                                                            : "bg-white text-gray-700 border-gray-200")
                                                    }
                                                >
                                                    {b}
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {detailOpties.length > 0 ? (
                                        <div className="mt-2 pl-2 border-l-2 border-sky-200 space-y-1.5">
                                            <span className="text-xs text-gray-600 block">
                                                Type {scherm.beugel.toLowerCase()}
                                            </span>
                                            <div className="flex flex-col gap-2">
                                                {detailOpties.map(
                                                    (d) => (
                                                        <button
                                                            key={d}
                                                            type="button"
                                                            onClick={() =>
                                                                updateItem(
                                                                    scherm.id,
                                                                    {
                                                                        bevestigingDetail:
                                                                            scherm.bevestigingDetail ===
                                                                            d
                                                                                ? ""
                                                                                : d,
                                                                    }
                                                                )
                                                            }
                                                            className={
                                                                "w-full rounded-lg px-3 py-2 border-2 text-sm font-medium text-left whitespace-nowrap "
                                                                +
                                                                (scherm.bevestigingDetail ===
                                                                d
                                                                    ? "bg-teal-100 text-teal-900 border-teal-300"
                                                                    : "bg-white text-gray-700 border-gray-200")
                                                            }
                                                        >
                                                            {d}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-xs text-gray-600">
                                        Oriëntatie
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "Landscape",
                                            "Portrait",
                                        ].map((o) => (
                                            <button
                                                key={o}
                                                type="button"
                                                onClick={() =>
                                                    updateItem(
                                                        scherm.id,
                                                        {
                                                            orientatie:
                                                                scherm.orientatie ===
                                                                o
                                                                    ? ""
                                                                    : o,
                                                        }
                                                    )
                                                }
                                                className={
                                                    "flex-1 min-w-[120px] rounded-lg py-2 border-2 text-sm font-medium "
                                                    +
                                                    (scherm.orientatie ===
                                                    o
                                                        ? "bg-violet-100 text-violet-900 border-violet-300"
                                                        : "bg-white text-gray-700 border-gray-200")
                                                }
                                            >
                                                {o}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <label className="block">
                                    <span className="text-xs text-gray-600">
                                        Locatie scherm
                                    </span>
                                    <input
                                        value={scherm.locatie}
                                        onChange={(e) =>
                                            updateItem(scherm.id, {
                                                locatie:
                                                    e.target.value,
                                            })
                                        }
                                        disabled={Boolean(
                                            scherm.naastSchermId
                                        )}
                                        placeholder="Bijv. Entree / Vergaderruimte 1"
                                        className="w-full border rounded-lg p-2 mt-0.5 bg-white disabled:bg-slate-50 disabled:text-gray-500"
                                    />
                                    {scherm.naastSchermId ? (
                                        <span className="text-[11px] text-gray-500">
                                            Locatie overgenomen van het
                                            gekozen scherm
                                        </span>
                                    ) : null}
                                </label>

                                <div className="space-y-2 pt-1 border-t border-slate-100">
                                    <span className="text-xs text-gray-600 block">
                                        Stroom aanwezig binnen 3 meter?
                                    </span>
                                    <JaNee
                                        value={scherm.stroom}
                                        onChange={(v) =>
                                            updateItem(scherm.id, {
                                                stroom: v,
                                                stroomMdb:
                                                    v === "Nee"
                                                        ? scherm.stroomMdb
                                                        : "",
                                            })
                                        }
                                    />
                                    {scherm.stroom === "Nee" ? (
                                        <div className="pl-2 border-l-2 border-amber-200 space-y-1.5">
                                            <span className="text-xs text-gray-600 block">
                                                MDB Networks
                                                realiseren?
                                            </span>
                                            <div className="flex gap-2">
                                                {[
                                                    "Ja",
                                                    "Nee",
                                                    "Anders",
                                                ].map((optie) => (
                                                    <button
                                                        key={optie}
                                                        type="button"
                                                        onClick={() =>
                                                            updateItem(
                                                                scherm.id,
                                                                {
                                                                    stroomMdb:
                                                                        scherm.stroomMdb ===
                                                                        optie
                                                                            ? ""
                                                                            : optie,
                                                                }
                                                            )
                                                        }
                                                        className={
                                                            "flex-1 rounded-lg py-1.5 border-2 text-xs font-medium "
                                                            +
                                                            (scherm.stroomMdb ===
                                                            optie
                                                                ? "bg-sky-100 text-sky-800 border-sky-300"
                                                                : "bg-white text-gray-700 border-gray-200")
                                                        }
                                                    >
                                                        {optie}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs text-gray-600 block">
                                        Internet aanwezig binnen 3
                                        meter?
                                    </span>
                                    <JaNee
                                        value={scherm.internet}
                                        onChange={(v) =>
                                            updateItem(scherm.id, {
                                                internet: v,
                                                internetMdb:
                                                    v === "Nee"
                                                        ? scherm.internetMdb
                                                        : "",
                                            })
                                        }
                                    />
                                    {scherm.internet === "Nee" ? (
                                        <div className="pl-2 border-l-2 border-amber-200 space-y-1.5">
                                            <span className="text-xs text-gray-600 block">
                                                MDB Networks
                                                realiseren?
                                            </span>
                                            <div className="flex gap-2">
                                                {[
                                                    "Ja",
                                                    "Nee",
                                                    "Anders",
                                                ].map((optie) => (
                                                    <button
                                                        key={optie}
                                                        type="button"
                                                        onClick={() =>
                                                            updateItem(
                                                                scherm.id,
                                                                {
                                                                    internetMdb:
                                                                        scherm.internetMdb ===
                                                                        optie
                                                                            ? ""
                                                                            : optie,
                                                                }
                                                            )
                                                        }
                                                        className={
                                                            "flex-1 rounded-lg py-1.5 border-2 text-xs font-medium "
                                                            +
                                                            (scherm.internetMdb ===
                                                            optie
                                                                ? "bg-sky-100 text-sky-800 border-sky-300"
                                                                : "bg-white text-gray-700 border-gray-200")
                                                        }
                                                    >
                                                        {optie}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}

                    {/* Overzicht berekende types */}
                    <div className="rounded-xl border border-[#0066FF]/20 bg-[#0066FF]/5 p-3">
                        <p className="text-xs font-semibold text-[#0066FF] mb-1.5">
                            Berekende installatietypes
                        </p>
                        <ul className="text-sm text-gray-800 space-y-0.5">
                            {items.map((s, i) => {
                                const t = berekendInstallatieType(
                                    s,
                                    items
                                );
                                const hoofd = isHoofdType(s, items);
                                const naastIndex = s.naastSchermId
                                    ? items.findIndex(
                                          (x) =>
                                              x.id === s.naastSchermId
                                      )
                                    : -1;

                                return (
                                    <li key={s.id}>
                                        Scherm {i + 1}
                                        {s.formaat
                                            ? ` (${s.formaat === "Anders" ? s.formaatAnders || "Anders" : s.formaat})`
                                            : ""}
                                        :{" "}
                                        <strong>
                                            {t
                                                ? `Type ${t}`
                                                : "— vul formaat in"}
                                        </strong>
                                        {hoofd
                                            ? " · hoofdtype"
                                            : " · vervolg"}
                                        {naastIndex >= 0
                                            ? ` · naast scherm ${naastIndex + 1}`
                                            : ""}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
