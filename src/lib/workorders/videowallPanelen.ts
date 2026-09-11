export type VideowallPaneel = {
    merk: string;
    type: string;
    serienummer: string;
    mac: string;
};

export function emptyVideowallPaneel(): VideowallPaneel {
    return {
        merk: "",
        type: "",
        serienummer: "",
        mac: "",
    };
}

/** "2x2" / "2 × 2" → 4 panelen. Anders 0. */
export function aantalPanelenVanConfiguratie(config: string): number {
    const match = config.trim().match(/(\d+)\s*[x×]\s*(\d+)/i);
    if (!match) {
        return 0;
    }

    const a = Number(match[1]);
    const b = Number(match[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 1 || b < 1) {
        return 0;
    }

    return a * b;
}

export function parseVideowallPanelen(raw: unknown): VideowallPaneel[] {
    if (typeof raw === "string") {
        try {
            return parseVideowallPanelen(JSON.parse(raw));
        } catch {
            return [];
        }
    }

    if (!Array.isArray(raw)) {
        return [];
    }

    return raw.map((item) => {
        if (!item || typeof item !== "object") {
            return emptyVideowallPaneel();
        }

        const row = item as Record<string, unknown>;
        return {
            merk: typeof row.merk === "string" ? row.merk : "",
            type: typeof row.type === "string" ? row.type : "",
            serienummer:
                typeof row.serienummer === "string" ? row.serienummer : "",
            mac: typeof row.mac === "string" ? row.mac : "",
        };
    });
}

export function syncVideowallPanelen(
    existing: VideowallPaneel[],
    count: number
): VideowallPaneel[] {
    if (count <= 0) {
        return [];
    }

    const next = existing.slice(0, count);
    while (next.length < count) {
        next.push(emptyVideowallPaneel());
    }
    return next;
}

export function panelenUitVelden(
    velden: Record<string, string>
): VideowallPaneel[] {
    return parseVideowallPanelen(velden.panelenJson);
}

export function videowallPaneelCompleet(paneel: VideowallPaneel): boolean {
    return Boolean(
        paneel.merk.trim()
        && paneel.type.trim()
        && paneel.serienummer.trim()
    );
}

export function ontbrekendeVideowallPanelen(
    perType: Partial<Record<string, Record<string, string>>> | undefined,
    fallbackVelden?: Record<string, string>
): string | null {
    const bronnen: Record<string, string>[] = [];

    if (perType) {
        for (const velden of Object.values(perType)) {
            if (velden) {
                bronnen.push(velden);
            }
        }
    }

    if (bronnen.length === 0 && fallbackVelden) {
        bronnen.push(fallbackVelden);
    }

    const namen: string[] = [];

    for (const velden of bronnen) {
        if ((velden.type || "").trim() !== "LCD") {
            continue;
        }

        const count = aantalPanelenVanConfiguratie(velden.configuratie || "");
        if (count <= 0) {
            continue;
        }

        const panelen = syncVideowallPanelen(
            panelenUitVelden(velden),
            count
        );

        panelen.forEach((paneel, i) => {
            if (videowallPaneelCompleet(paneel)) {
                return;
            }
            namen.push(`Videowall scherm ${i + 1}`);
        });
    }

    if (namen.length === 0) {
        return null;
    }

    return `Vul merk, type en serienummer in bij: ${namen.join(", ")}. MAC-adres is optioneel.`;
}
