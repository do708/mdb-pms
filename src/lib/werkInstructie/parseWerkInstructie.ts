export type InstructieBlok =
    | { soort: "kop"; tekst: string }
    | { soort: "regel"; label: string; waarde: string }
    | { soort: "tabel"; koppen: string[]; rijen: string[][] }
    | { soort: "links"; urls: string[] }
    | { soort: "tekst"; tekst: string };

const URL_RE = /https?:\/\/[^\s<>"'()]+/gi;

export function urlsUitTekst(waarde: string): string[] {
    const gevonden = waarde.match(URL_RE) ?? [];
    return gevonden.map((url) => url.replace(/[.,;:]+$/g, ""));
}

function decodeEntities(waarde: string): string {
    return waarde
        .replace(/&apos;/gi, "'")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/gi, '"')
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&nbsp;/gi, " ");
}

function kolommen(regel: string): string[] {
    const trim = regel.replace(/\u00a0/g, " ").trim();
    if (!trim) {
        return [];
    }
    if (trim.includes("\t")) {
        return trim.split("\t").map((cel) => cel.trim());
    }
    if (/\s{2,}/.test(trim)) {
        return trim.split(/\s{2,}/).map((cel) => cel.trim()).filter(Boolean);
    }
    return [trim];
}

function isKopRegel(cel: string): boolean {
    return /^(setups?|installatie[-\s]?opmerkingen)$/i.test(cel.trim());
}

function isTabelKop(cellen: string[]): boolean {
    const eerste = (cellen[0] || "").toLowerCase();
    return (
        cellen.length >= 2
        && /hoeveelheid|aantal|qty/i.test(eerste)
        && cellen.some((c) => /artikel|omschrijving|sku/i.test(c))
    );
}

function isUrlRegel(regel: string): boolean {
    const trim = regel.trim();
    if (!trim) {
        return false;
    }
    const urls = urlsUitTekst(trim);
    if (urls.length === 0) {
        return false;
    }
    const zonder = trim
        .replace(URL_RE, "")
        .replace(/foto\s*link/gi, "")
        .trim();
    return zonder.length === 0;
}

export function parseWerkInstructie(ruw: string): InstructieBlok[] {
    const tekst = decodeEntities(ruw || "").replace(/\r\n/g, "\n");
    if (!tekst.trim()) {
        return [];
    }

    const regels = tekst.split("\n");
    const blokken: InstructieBlok[] = [];
    let i = 0;

    function pushTekst(stukken: string[]) {
        const t = stukken.join("\n").trim();
        if (t) {
            blokken.push({ soort: "tekst", tekst: t });
        }
    }

    while (i < regels.length) {
        const regel = regels[i] ?? "";
        const cellen = kolommen(regel);

        if (!regel.trim()) {
            i += 1;
            continue;
        }

        if (isUrlRegel(regel) || (cellen.length >= 2 && isUrlRegel(cellen.slice(1).join(" ")))) {
            const urls: string[] = [];
            while (i < regels.length) {
                const r = regels[i] ?? "";
                if (!r.trim()) {
                    i += 1;
                    continue;
                }
                if (!isUrlRegel(r) && !(kolommen(r).length >= 2 && isUrlRegel(kolommen(r).slice(1).join(" ")))) {
                    break;
                }
                urls.push(...urlsUitTekst(r));
                i += 1;
            }
            if (urls.length) {
                blokken.push({ soort: "links", urls: [...new Set(urls)] });
            }
            continue;
        }

        if (cellen.length === 1 && isKopRegel(cellen[0])) {
            blokken.push({ soort: "kop", tekst: cellen[0] });
            i += 1;
            continue;
        }

        if (cellen.length >= 2 && /^(setup\s*naam|setup\s*opmerkingen)$/i.test(cellen[0])) {
            blokken.push({
                soort: "regel",
                label: cellen[0],
                waarde: cellen.slice(1).join(" ").trim(),
            });
            i += 1;
            continue;
        }

        if (isTabelKop(cellen)) {
            const koppen = cellen;
            const rijen: string[][] = [];
            i += 1;
            while (i < regels.length) {
                const r = regels[i] ?? "";
                if (!r.trim()) {
                    i += 1;
                    break;
                }
                const c = kolommen(r);
                if (c.length === 1 && isKopRegel(c[0])) {
                    break;
                }
                if (c.length >= 2 && /^(setup\s*naam|setup\s*opmerkingen)$/i.test(c[0])) {
                    break;
                }
                if (isUrlRegel(r)) {
                    break;
                }
                if (c.length >= 2) {
                    rijen.push(c);
                    i += 1;
                    continue;
                }
                break;
            }
            blokken.push({ soort: "tabel", koppen, rijen });
            continue;
        }

        const buffer: string[] = [regel];
        i += 1;
        while (i < regels.length) {
            const r = regels[i] ?? "";
            if (!r.trim()) {
                i += 1;
                break;
            }
            const c = kolommen(r);
            if (c.length === 1 && isKopRegel(c[0])) {
                break;
            }
            if (isTabelKop(c) || isUrlRegel(r)) {
                break;
            }
            if (c.length >= 2 && /^(setup\s*naam|setup\s*opmerkingen)$/i.test(c[0])) {
                break;
            }
            buffer.push(r);
            i += 1;
        }
        pushTekst(buffer);
    }

    return blokken;
}

function bestandsnaamUitUrl(url: string): string {
    try {
        const stuk = new URL(url).pathname.split("/").pop() || "";
        return decodeURIComponent(stuk).toLowerCase();
    } catch {
        return url.split("/").pop()?.toLowerCase() || "";
    }
}

/** Setup-foto's uit de werkinstructie horen niet bij de installatiefoto's. */
export function isInfoFotoVanInstructie(
    photo: { url: string; filename?: string | null },
    werkInstructie: string | null | undefined
): boolean {
    const instructieUrls = urlsUitTekst(werkInstructie || "");

    if (instructieUrls.length === 0) {
        return false;
    }

    if (instructieUrls.includes(photo.url)) {
        return true;
    }

    const naam = (photo.filename || "").split("/").pop()?.toLowerCase() || "";

    if (!naam) {
        return false;
    }

    return instructieUrls.some((url) => {
        const stuk = bestandsnaamUitUrl(url);
        return Boolean(stuk) && (naam === stuk || naam.endsWith(stuk) || stuk.endsWith(naam));
    });
}

export function zonderInstructieFotos<T extends { url: string; filename?: string | null }>(
    photos: T[],
    werkInstructie: string | null | undefined
): T[] {
    return photos.filter(
        (photo) => !isInfoFotoVanInstructie(photo, werkInstructie)
    );
}
