/**
 * eValue8-producten voor het aanvraagportaal (zonder prijzen).
 * Alleen productcode + omschrijving.
 */

export interface Evalue8Product {
    code: string;
    product: string;
}

export interface Evalue8ProductGroep {
    titel: string;
    producten: Evalue8Product[];
}

export const EVALUE8_PRODUCT_GROEPEN: Evalue8ProductGroep[] = [
    {
        titel: "Productoverzicht",
        producten: [
            {
                code: "INST-DS-BE1",
                product:
                    "Installatie toeslag Belgie I (< 300 km)",
            },
            {
                code: "INST-DS-BE2",
                product:
                    "Installatie toeslag Belgie I (> 300 km)",
            },
            {
                code: "INST-DS-DSPL",
                product:
                    "Aansluiten extra scherm (i.c.m. volledige installatie)",
            },
            {
                code: "INST-DS-EASY",
                product:
                    "Complete installatie Narrowcasting internet/elektra max. 1m",
            },
            {
                code: "INST-DS-FULL",
                product:
                    "Complete installatie Narrowcasting internet/elektra max. 3m",
            },
            {
                code: "INST-DS-HER",
                product:
                    "Demontage + complete installatie Narrowcasting",
            },
            {
                code: "INST-DS-PLYR",
                product: "Installatie player (op bestaand scherm)",
            },
            {
                code: "INST-DS-PROJ",
                product:
                    "Project/Collectief complete installatie Narrowcasting",
            },
            {
                code: "INST-DS-SCRN",
                product: "Complete installatie scherm",
            },
            {
                code: "INST-DS-SWAP",
                product:
                    "Omwisselen scherm/player op bestaande installatie",
            },
            {
                code: "INST-DS-WKS",
                product:
                    "Complete installatie Wachtkamerschermen Narrowcasting",
            },
            {
                code: "INST-DS-ZKAPG",
                product:
                    "Complete vervolginstallatie Narrowcasting >15 min.",
            },
            {
                code: "INST-DS-ZKAPK",
                product:
                    "Complete vervolginstallatie Narrowcasting <15 min.",
            },
            {
                code: "INST-QM-DISP-10M",
                product:
                    "Installatie Queue Management Kiosk max. 10m",
            },
            {
                code: "INST-QM-DISP-1M",
                product:
                    "Installatie Queue Management Kiosk max. 1m",
            },
            {
                code: "INST-QM-DISP-3M",
                product:
                    "Installatie Queue Management Kiosk max. 3m",
            },
            {
                code: "INST-VERW",
                product: "Afvoerkosten materialen",
            },
            {
                code: "INST-VOOR",
                product: "Voorrijdtarief Installateur",
            },
            {
                code: "TRF-ARB",
                product: "Installatiekosten per uur",
            },
            {
                code: "TRF-STT1",
                product:
                    "Storing type 1 - Binnen 3 werkdagen (max. 1 uur arbeid)",
            },
            {
                code: "TRF-STT2",
                product:
                    "Storing type 2 - Binnen 5 werkdagen (max. 1 uur arbeid)",
            },
        ],
    },
    {
        titel: "Beugels",
        producten: [
            {
                code: "EV-1",
                product: 'Levering muur beugel tot 32" (MDB)',
            },
            {
                code: "EV-2",
                product: 'Levering muur beugel tot 37-63" (MDB)',
            },
            {
                code: "EV-3",
                product:
                    'Levering plafondbeugel systeem 32" tot 49" - 150cm (Vogels)',
            },
            {
                code: "EV-4",
                product:
                    'Levering plafondbeugel systeem 42" tot 65" - 300cm (Vogels)',
            },
            {
                code: "EV-5",
                product: 'Levering muur beugel zwenk tot 65" (MDB)',
            },
            {
                code: "EV-6",
                product:
                    'Levering muur beugel zwenk tot 32" Type 3145 (Vogels)',
            },
            {
                code: "EV-7",
                product:
                    'Levering muur beugel zwenk tot 42" Type 3245 (Vogels)',
            },
            {
                code: "EV-8",
                product:
                    'Levering muur beugel zwenk tot 63" Type 3345 (Vogels)',
            },
            {
                code: "EV-9",
                product:
                    "Levering muur beugel kiosk Type 4210 (Vogels)",
            },
        ],
    },
    {
        titel: "Materiaal",
        producten: [
            {
                code: "MAT-AFVOER",
                product: "Afval verwijdering",
            },
            {
                code: "MAT-AFKSK",
                product: "Afvoeren Kiosk",
            },
        ],
    },
];

export interface Evalue8ProductKeuze {
    code: string;
    product: string;
    aantal: string;
}

export function isEvalue8Opdrachtgever(naam: string): boolean {
    return naam.trim().toLowerCase().replace(/\s+/g, "") === "evalue8";
}

/** Geselecteerde regels als platte lijst (alleen aangevinkt). */
export function evalue8KeuzesVanState(
    state: Record<string, { aan: boolean; aantal: string }>
): Evalue8ProductKeuze[] {
    const result: Evalue8ProductKeuze[] = [];

    for (const groep of EVALUE8_PRODUCT_GROEPEN) {
        for (const p of groep.producten) {
            const s = state[p.code];
            if (!s?.aan) {
                continue;
            }
            result.push({
                code: p.code,
                product: p.product,
                aantal: s.aantal.trim() || "1",
            });
        }
    }

    return result;
}
