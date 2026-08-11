"use client";

import { useEffect, useRef } from "react";

export type PlanningMenuAction = "open" | "edit" | "delete";

export type PlanningMenuTarget =
    | {
          kind: "agenda";
          event: any;
      }
    | {
          kind: "workorder";
          workorder: any;
      };

export interface PlanningMenuState {
    target: PlanningMenuTarget;
    x: number;
    y: number;
}

export default function PlanningActivityMenu({
    menu,
    onAction,
    onClose,
    allowMutate = true,
}: {
    menu: PlanningMenuState | null;
    onAction: (
        action: PlanningMenuAction,
        target: PlanningMenuTarget
    ) => void;
    onClose: () => void;
    allowMutate?: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menu) return;

        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }

        function onPointerDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }

        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onPointerDown);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onPointerDown);
        };
    }, [menu, onClose]);

    if (!menu) return null;

    const label =
        menu.target.kind === "agenda"
            ? menu.target.event.title
            : `${menu.target.workorder.number ?? ""} ${menu.target.workorder.title}`.trim();

    // Houd het menu binnen het viewport.
    const left = Math.min(menu.x, window.innerWidth - 180);
    const top = Math.min(menu.y, window.innerHeight - 160);

    const items: {
        action: PlanningMenuAction;
        label: string;
        danger?: boolean;
    }[] = [
        { action: "open", label: "Openen" },
        ...(allowMutate
            ? [
                  { action: "edit" as const, label: "Wijzigen" },
                  {
                      action: "delete" as const,
                      label: "Verwijderen",
                      danger: true,
                  },
              ]
            : []),
    ];

    return (
        <div
            ref={ref}
            role="menu"
            aria-label={`Acties voor ${label}`}
            className="
                fixed z-[80] min-w-[10rem]
                rounded-xl border border-slate-200 bg-white
                py-1 shadow-lg
            "
            style={{ left, top }}
        >
            <p className="px-3 py-1.5 text-[10px] font-medium text-slate-400 truncate max-w-[14rem]">
                {label}
            </p>
            {items.map((item) => (
                <button
                    key={item.action}
                    type="button"
                    role="menuitem"
                    className={`
                        w-full px-3 py-2 text-left text-sm
                        hover:bg-slate-50 transition
                        ${
                            item.danger
                                ? "text-red-600 hover:bg-red-50"
                                : "text-slate-800"
                        }
                    `}
                    onClick={(e) => {
                        e.stopPropagation();
                        onAction(item.action, menu.target);
                    }}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}
