"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { canAccessOffice } from "@/lib/auth/checkRole";
import {
    OFFICE_NOTIFICATION_LABEL,
    type OfficeNotification,
    type OfficeNotificationSoort,
} from "@/lib/officeNotificationTypes";

const SOORT_STYLE: Record<OfficeNotificationSoort, string> = {
    aanvraag: "bg-amber-100 text-amber-800",
    formulier: "bg-sky-100 text-sky-800",
    telaat: "bg-red-100 text-red-700",
    materiaal: "bg-orange-100 text-orange-800",
    planningsconflict: "bg-pink-100 text-[#d6007e]",
};

export default function NotificationBell() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const role = session?.user?.role ?? "";
    const canSee =
        status === "authenticated" && canAccessOffice(role);

    const [items, setItems] = useState<OfficeNotification[]>([]);
    const [count, setCount] = useState(0);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const load = useCallback(async () => {
        try {
            const response = await fetch("/api/notifications", {
                cache: "no-store",
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            const nextItems = Array.isArray(data.items) ? data.items : [];
            const nextCount =
                typeof data.count === "number"
                    ? data.count
                    : nextItems.length;

            setItems(nextItems);
            setCount(nextCount);
        } catch {
            // stil falen; bel blijft staan met laatste bekende stand
        }
    }, []);

    useEffect(() => {
        if (!canSee) {
            return;
        }

        void load();

        // Elke 30 seconden verversen (dashboard-tellers blijven synchroon).
        const timer = setInterval(() => {
            void load();
        }, 30 * 1000);

        function onFocus() {
            void load();
        }

        function onVisibility() {
            if (document.visibilityState === "visible") {
                void load();
            }
        }

        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            clearInterval(timer);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [canSee, load, pathname]);

    useEffect(() => {
        function onClick(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", onClick);

        return () =>
            document.removeEventListener("mousedown", onClick);
    }, []);

    if (status === "loading") {
        return (
            <div className="p-2 text-gray-300" aria-hidden>
                <Bell size={21} />
            </div>
        );
    }

    if (!canSee) {
        return null;
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    setOpen((o) => !o);
                    void load();
                }}
                className="
                    relative p-2 rounded-full
                    hover:bg-gray-100 transition
                "
                aria-label={
                    count > 0
                        ? `${count} meldingen`
                        : "Meldingen"
                }
            >
                <Bell size={21} />

                {count > 0 && (
                    <span
                        className="
                            absolute -top-0.5 -right-0.5
                            min-w-[18px] h-[18px] px-1
                            bg-[#d6007e] text-white
                            text-[10px] font-bold
                            rounded-full
                            flex items-center justify-center
                        "
                    >
                        {count}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="
                        absolute right-0 mt-2
                        w-96 max-w-[90vw]
                        bg-white border rounded-2xl
                        shadow-lg z-50 overflow-hidden
                    "
                >
                    <div className="px-4 py-3 border-b">
                        <p className="font-semibold text-sm text-gray-900">
                            Meldingen
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Open aanvragen, formulieren, te laat, materiaal en
                            planningsconflicten
                        </p>
                    </div>

                    {count === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-500 text-center">
                            Geen openstaande meldingen.
                        </p>
                    ) : (
                        <div className="max-h-96 overflow-auto">
                            {items.map((item) => (
                                <a
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="
                                        block px-4 py-3 border-b
                                        hover:bg-gray-50
                                    "
                                >
                                    <span
                                        className={`
                                            inline-block text-[10px] font-semibold
                                            rounded-full px-2 py-0.5 mb-1
                                            ${SOORT_STYLE[item.soort]}
                                        `}
                                    >
                                        {
                                            OFFICE_NOTIFICATION_LABEL[
                                                item.soort
                                            ]
                                        }
                                    </span>
                                    <p className="font-medium text-sm text-gray-900">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {item.subtitle}
                                    </p>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
