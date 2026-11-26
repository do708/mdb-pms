import {
    TOOL_STATUS_COLORS,
    TOOL_STATUS_LABELS,
    type ToolStatus,
} from "@/constants/gereedschap";

export default function StatusBadge({ status }: { status: string }) {
    const label =
        TOOL_STATUS_LABELS[status as ToolStatus] ?? status;
    const color =
        TOOL_STATUS_COLORS[status as ToolStatus] ??
        "bg-slate-100 text-slate-700 border-slate-300";

    return (
        <span
            className={`
                inline-flex items-center rounded-full border
                px-2.5 py-0.5 text-xs font-semibold
                ${color}
            `}
        >
            {label}
        </span>
    );
}
