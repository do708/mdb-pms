"use client";

import { PlanningStatusIcon } from "./PlanningStatusIcon";

interface Props {
    item: any;
    draggable?: boolean;
    showStatusIcon?: boolean;
    onMenu?: (args: { item: any; x: number; y: number }) => void;
}

export default function DraggableAssignment({
    item,
    draggable = false,
    showStatusIcon = true,
    onMenu,
}: Props) {
    // De planning-API levert opdrachten: de klant hangt onder project.
    const customer = item.customer ?? item.project?.customer;

    function handleDragStart(event: React.DragEvent) {
        event.dataTransfer.setData("workorderId", item.id);
    }

    const engineers = [
        item.assignedUser?.name,
        ...(Array.isArray(item.extraEngineers)
            ? item.extraEngineers.map((e: any) => e.user?.name)
            : []),
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <div
            data-planning-job
            role="button"
            tabIndex={0}
            draggable={draggable}
            onDragStart={draggable ? handleDragStart : undefined}
            onClick={(e) => {
                e.stopPropagation();
                onMenu?.({
                    item,
                    x: e.clientX,
                    y: e.clientY,
                });
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onMenu?.({ item, x: 0, y: 0 });
                }
            }}
            className={`
                text-white rounded-lg px-1.5 py-1 leading-tight
                shadow-sm ring-1 ring-black/10 cursor-pointer
                ${draggable ? "cursor-grab active:cursor-grabbing" : ""}
            `}
            style={{
                backgroundColor: customer?.color ?? "#0066FF",
            }}
        >
            <div className="flex items-start justify-between gap-1">
                <span className="text-[11px] font-bold truncate min-w-0">
                    {engineers || "Geen monteur"}
                </span>
                {showStatusIcon && (
                    <PlanningStatusIcon status={item.status} />
                )}
            </div>
            <span className="text-[11px] block truncate opacity-95">
                {customer?.name ?? "Onbekende klant"}
            </span>
            <span className="text-[10px] block truncate opacity-90">
                {item.title}
            </span>
        </div>
    );
}
