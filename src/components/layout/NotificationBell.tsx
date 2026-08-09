"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import {
    OFFICE_NOTIFICATION_LABEL,
    type OfficeNotification,
    type OfficeNotificationSoort,
} from "@/lib/officeNotificationTypes";

const SOORT_STYLE: Record<
    OfficeNotificationSoort,
    string
> = {
    aanvraag: "bg-amber-100 text-amber-800",
    formulier: "bg-sky-100 text-sky-800",
    telaat: "bg-red-100 text-red-700",
    materiaal: "bg-orange-100 text-orange-800",
};

export default function NotificationBell() {
    const { data: session } = useSession();
    const role = session?.user?.role;
    const canSee = role === "admin" || role === "office";

    const [items, setItems] = useState<OfficeNotification[]>([]);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    async function load() {
        try {
            const response = await fetch("/api/notifications");

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            setItems(
                Array.isArray(data.items) ? data.items : []
            );
        } catch {
            // stil falen; de bel toont dan gewoon geen meldingen
        }
    }

    useEffect(() => {
        if (!canSee) {
            return;
        }

        load();

        const timer = setInterval(load, 5 * 60 * 1000);

        return () => clearInterval(timer);
    }, [canSee]);

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

    if (!canSee) {
        return null;
    }

    const count = items.length;

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
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
                            Aanvragen, formulieren, te late opdrachten en materiaal
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
