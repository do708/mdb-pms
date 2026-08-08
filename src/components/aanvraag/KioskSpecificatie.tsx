"use client";

import {
    AanvraagKioskItem,
    syncKioskItems,
} from "@/lib/aanvraag/installatieTypes";
import { StroomInternetVragen } from "@/components/aanvraag/StroomInternetVragen";

interface Props {
    aantal: string;
    onAantalChange: (aantal: string) => void;
    items: AanvraagKioskItem[];
    onItemsChange: (items: AanvraagKioskItem[]) => void;
}

export default function KioskSpecificatie({
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

        onItemsChange(syncKioskItems(items, n));
    }

    function updateItem(
        id: string,
        patch: Partial<AanvraagKioskItem>
    ) {
        onItemsChange(
            items.map((k) =>
                k.id === id ? { ...k, ...patch } : k
            )
        );
    }

    return (
        <div className="space-y-4">
            <label className="block">
                <span className="text-xs text-gray-600">
                    Aantal kiosken
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
                    {items.map((kiosk, index) => (
                        <div
                            key={kiosk.id}
                            className="rounded-xl border border-amber-200 bg-white p-3 space-y-3"
                        >
                            <p className="font-semibold text-sm text-gray-800">
                                Kiosk {index + 1}
                            </p>

                            <label className="block">
                                <span className="text-xs text-gray-600">
                                    Locatie kiosk{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </span>
                                <input
                                    value={kiosk.locatie}
                                    onChange={(e) =>
                                        updateItem(kiosk.id, {
                                            locatie: e.target.value,
                                        })
                                    }
                                    placeholder="Bijv. Entree / Balie"
                                    className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                                />
                            </label>

                            <label className="block">
                                <span className="text-xs text-gray-600">
                                    Type kiosk
                                </span>
                                <input
                                    value={kiosk.type}
                                    onChange={(e) =>
                                        updateItem(kiosk.id, {
                                            type: e.target.value,
                                        })
                                    }
                                    placeholder="Bijv. Easy, Full, Extended"
                                    className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                                />
                            </label>

                            <label className="block">
                                <span className="text-xs text-gray-600">
                                    Opmerking
                                </span>
                                <input
                                    value={kiosk.opmerking}
                                    onChange={(e) =>
                                        updateItem(kiosk.id, {
                                            opmerking:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="Aanvullende details"
                                    className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                                />
                            </label>

                            <StroomInternetVragen
                                velden={{
                                    stroom: kiosk.stroom,
                                    stroomMdb: kiosk.stroomMdb,
                                    stroomAfstand:
                                        kiosk.stroomAfstand,
                                    stroomTraject:
                                        kiosk.stroomTraject,
                                    internet: kiosk.internet,
                                    internetMdb:
                                        kiosk.internetMdb,
                                    internetAfstand:
                                        kiosk.internetAfstand,
                                    internetTraject:
                                        kiosk.internetTraject,
                                }}
                                onChange={(
                                    veldOrPatch,
                                    waarde
                                ) => {
                                    if (
                                        typeof veldOrPatch ===
                                        "string"
                                    ) {
                                        updateItem(kiosk.id, {
                                            [veldOrPatch]:
                                                waarde || "",
                                        } as Partial<AanvraagKioskItem>);
                                    } else {
                                        updateItem(
                                            kiosk.id,
                                            veldOrPatch as Partial<AanvraagKioskItem>
                                        );
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
