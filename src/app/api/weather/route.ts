import { NextResponse } from "next/server";

/** Kantoor MDB: Monitorweg 10, Almere */
const LAT = 52.3702;
const LON = 5.2145;

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

export async function GET() {
    try {
        const url =
            `https://api.open-meteo.com/v1/forecast`
            + `?latitude=${LAT}`
            + `&longitude=${LON}`
            + `&current=temperature_2m,weather_code`
            + `&timezone=Europe%2FAmsterdam`;

        const response = await fetch(url, {
            next: { revalidate: 900 },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Weer ophalen mislukt" },
                { status: 502 }
            );
        }

        const data = await response.json();
        const temperature = Number(data?.current?.temperature_2m);
        const weatherCode = Number(data?.current?.weather_code);

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
                "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
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
