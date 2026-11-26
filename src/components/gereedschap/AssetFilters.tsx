"use client";

import { TOOL_CATEGORIES, TOOL_CATEGORY_LABELS, TOOL_STATUSES, TOOL_STATUS_LABELS } from "@/constants/gereedschap";
import { specInputClassName, specSelectClassName } from "@/components/ui/SpecLayout";

export type AssetFilterState = {
    q: string;
    bus: string;
    kantoor: "" | "1" | "0";
    status: string;
    category: string;
};

export const EMPTY_FILTERS: AssetFilterState = {
    q: "",
    bus: "",
    kantoor: "",
    status: "",
    category: "",
};

export default function AssetFilters({
    value,
    onChange,
}: {
    value: AssetFilterState;
    onChange: (next: AssetFilterState) => void;
}) {
    function set<K extends keyof AssetFilterState>(
        key: K,
        v: AssetFilterState[K]
    ) {
        onChange({ ...value, [key]: v });
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block text-sm">
                <span className="text-gray-600">Naam / code</span>
                <input
                    className={specInputClassName}
                    value={value.q}
                    onChange={(e) => set("q", e.target.value)}
                    placeholder="Zoeken…"
                />
            </label>
            <label className="block text-sm">
                <span className="text-gray-600">Bus-kenteken</span>
                <input
                    className={specInputClassName}
                    value={value.bus}
                    onChange={(e) => set("bus", e.target.value)}
                    placeholder="bijv. X-123-YZ"
                />
            </label>
            <label className="block text-sm">
                <span className="text-gray-600">Kantoor</span>
                <select
                    className={specSelectClassName}
                    value={value.kantoor}
                    onChange={(e) =>
                        set("kantoor", e.target.value as "" | "1" | "0")
                    }
                >
                    <option value="">Alles</option>
                    <option value="1">Alleen kantoor</option>
                    <option value="0">Niet kantoor</option>
                </select>
            </label>
            <label className="block text-sm">
                <span className="text-gray-600">Status</span>
                <select
                    className={specSelectClassName}
                    value={value.status}
                    onChange={(e) => set("status", e.target.value)}
                >
                    <option value="">Alles</option>
                    {TOOL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {TOOL_STATUS_LABELS[s]}
                        </option>
                    ))}
                </select>
            </label>
            <label className="block text-sm">
                <span className="text-gray-600">Categorie</span>
                <select
                    className={specSelectClassName}
                    value={value.category}
                    onChange={(e) => set("category", e.target.value)}
                >
                    <option value="">Alles</option>
                    {TOOL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                            {c} — {TOOL_CATEGORY_LABELS[c]}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}
