"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

/** nl-NL zet week-/maandnamen vaak klein; eerste letter hoofdletter. */
function formatNlDate(date: Date): string {
    const raw = date.toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    return raw.replace(
        /(^|[\s–-])([a-zà-ÿ])/g,
        (_, sep, ch) => sep + ch.toUpperCase()
    );
}

export default function DateTime() {
    // Start als null zodat server en client hetzelfde renderen (geen tijd).
    const [date, setDate] = useState<Date | null>(null);

    useEffect(() => {
        setDate(new Date());
        const timer = setInterval(() => {
            setDate(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-3 text-sm">
            <Clock3 size={20} className="text-[#12345b] shrink-0" />

            <div className="leading-tight min-w-0">
                <p className="font-semibold text-gray-900 tabular-nums">
                    {date
                        ? date.toLocaleTimeString("nl-NL", {
                              hour: "2-digit",
                              minute: "2-digit",
                          })
                        : "--:--"}
                </p>

                <p className="text-xs text-gray-500 whitespace-nowrap">
                    {date ? formatNlDate(date) : ""}
                </p>
            </div>
        </div>
    );
}
