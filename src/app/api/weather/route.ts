import { NextResponse } from "next/server";

/** Kantoor MDB: Monitorweg 10, 1322 BJ Almere */
const LAT = 52.34782;
const LON = 5.1774;

export type WeatherPayload = {
    temperature: number;
    weatherCode: number;
    label: string;
};

/** WMO weather interpretation codes → korte NL-label. */
export function weatherLabel(code: number): string {
    if (code === 0) return "Zon";
    if (code === 1) return "Overwegend helder";
    if (code === 2) return "Halfbewolkt";
    if (code === 3) return "Bewolkt";
    if (code === 45 || code === 48) return "Mist";
    if (code >= 51 && code <= 57) return "Motregen";
    if (code >= 61 && code <= 67) return "Regen";
    if (code >= 71 && code <= 77) return "Sneeuw";
    if (code >= 80 && code <= 82) return "Buien";
    if (code === 85 || code === 86) return "Sneeuwbuien";
    if (code >= 95) return "Onweer";
    return "Wisselvallig";
}

function isPrecipCode(code: number): boolean {
    return (
        (code >= 51 && code <= 67)
        || (code >= 71 && code <= 77)
        || (code >= 80 && code <= 86)
        || code >= 95
    );
}

function codeFromPrecipMm(mm: number): number {
    if (mm >= 4) return 65;
    if (mm >= 1) return 63;
    if (mm >= 0.2) return 61;
    return 51;
}

function pushSlot(
    codes: number[],
    precipValues: number[],
    code: unknown,
    ...mm: unknown[]
) {
    const n = Number(code);
    if (Number.isFinite(n)) codes.push(n);
    for (const value of mm) {
        precipValues.push(Number(value) || 0);
    }
}

/**
 * Open-Meteo `current.weather_code` loopt vaak achter op buien.
 * Gebruik neerslag + het huidige uur en de volgende 15-minuten-slot.
 */
export function effectiveWeatherCode(
    current: {
        weather_code?: number;
        precipitation?: number;
        rain?: number;
        showers?: number;
    },
    minutely?: {
        weather_code?: number[];
        precipitation?: number[];
        rain?: number[];
    },
    hourly?: {
        weather_code?: number[];
        precipitation?: number[];
        rain?: number[];
    },
): number {
    const currentCode = Number(current.weather_code);
    const precipValues = [
        Number(current.precipitation) || 0,
        Number(current.rain) || 0,
        Number(current.showers) || 0,
    ];

    const codes: number[] = Number.isFinite(currentCode) ? [currentCode] : [];
    const n = Math.min(2, minutely?.weather_code?.length ?? 0);
    for (let i = 0; i < n; i++) {
        pushSlot(
            codes,
            precipValues,
            minutely?.weather_code?.[i],
            minutely?.precipitation?.[i],
            minutely?.rain?.[i],
        );
    }
    pushSlot(
        codes,
        precipValues,
        hourly?.weather_code?.[0],
        hourly?.precipitation?.[0],
        hourly?.rain?.[0],
    );

    const rainCodes = codes.filter(isPrecipCode);
    if (rainCodes.length > 0) {
        return Math.max(...rainCodes);
    }

    const mm = Math.max(...precipValues);
    if (mm > 0) {
        return codeFromPrecipMm(mm);
    }

    return currentCode;
}

export async function GET() {
    try {
        const url =
            `https://api.open-meteo.com/v1/forecast`
            + `?latitude=${LAT}`
            + `&longitude=${LON}`
            + `&current=temperature_2m,weather_code,precipitation,rain,showers`
            + `&minutely_15=weather_code,precipitation,rain`
            + `&forecast_minutely_15=4`
            + `&hourly=weather_code,precipitation,rain`
            + `&forecast_hours=1`
            + `&timezone=Europe%2FAmsterdam`;

        const response = await fetch(url, {
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Weer ophalen mislukt" },
                { status: 502 }
            );
        }

        const data = await response.json();
        const temperature = Number(data?.current?.temperature_2m);
        const weatherCode = effectiveWeatherCode(
            data?.current ?? {},
            data?.minutely_15,
            data?.hourly,
        );

        if (!Number.isFinite(temperature) || !Number.isFinite(weatherCode)) {
            return NextResponse.json(
                { error: "Ongeldige weerdata" },
                { status: 502 }
            );
        }

        const payload: WeatherPayload = {
            temperature: Math.round(temperature),
            weatherCode,
            label: weatherLabel(weatherCode),
        };

        return NextResponse.json(payload, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
        });
    } catch (error) {
        console.error("WEATHER API ERROR", error);
        return NextResponse.json(
            { error: "Weer ophalen mislukt" },
            { status: 500 }
        );
    }
}
