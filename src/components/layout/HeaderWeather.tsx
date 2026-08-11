"use client";

import { useEffect, useState } from "react";
import {
    Cloud,
    CloudDrizzle,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSnow,
    CloudSun,
    Sun,
    type LucideIcon,
} from "lucide-react";

type WeatherState = {
    temperature: number;
    weatherCode: number;
    label: string;
};

function iconForCode(code: number): LucideIcon {
    if (code === 0) return Sun;
    if (code === 1 || code === 2) return CloudSun;
    if (code === 3) return Cloud;
    if (code === 45 || code === 48) return CloudFog;
    if (code >= 51 && code <= 57) return CloudDrizzle;
    if (code >= 61 && code <= 67) return CloudRain;
    if (code >= 71 && code <= 77) return CloudSnow;
    if (code >= 80 && code <= 82) return CloudRain;
    if (code === 85 || code === 86) return CloudSnow;
    if (code >= 95) return CloudLightning;
    return Cloud;
}

export default function HeaderWeather() {
    const [weather, setWeather] = useState<WeatherState | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const response = await fetch("/api/weather");
                if (!response.ok) return;
                const data = await response.json();
                if (
                    cancelled
                    || typeof data?.temperature !== "number"
                    || typeof data?.weatherCode !== "number"
                ) {
                    return;
                }
                setWeather({
                    temperature: data.temperature,
                    weatherCode: data.weatherCode,
                    label:
                        typeof data.label === "string"
                            ? data.label
                            : "Weer",
                });
            } catch {
                // stil falen — header blijft bruikbaar zonder weer
            }
        }

        load();
        const timer = setInterval(load, 15 * 60 * 1000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    if (!weather) {
        return null;
    }

    const Icon = iconForCode(weather.weatherCode);

    return (
        <div
            className="
                flex items-center gap-1
                text-sm text-gray-700
                tabular-nums shrink-0
            "
            title={`${weather.label} · Monitorweg, Almere`}
            aria-label={`Weer: ${weather.label}, ${weather.temperature} graden`}
        >
            <Icon
                size={16}
                className="text-[#12345b] shrink-0"
                aria-hidden
            />
            <span className="font-semibold text-gray-900">
                {weather.temperature}°
            </span>
        </div>
    );
}
