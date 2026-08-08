/**
 * eValue8-producten voor het aanvraagportaal (zonder prijzen).
 * Meest voorkomende artikelen eerst; daarna overige installatie/tarieven.
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
        titel: "Hardware",
        producten: [
            {
                code: "LG-43UN640S",
                product:
                    '43 inch (109 cm) Commercial Lite 4K LED TV',
            },
            {
                code: "LG-43PK640S",
                product:
                    '43 inch (109 cm) Commercial Lite 4K LED TV',
            },
            {
                code: "EV8-WP-BTR6",
                product:
                    "Narrowcasting Speler Beter (Windows)",
            },
            {
                code: "EV8-WP-AIO15-1",
                product: '15,6" FullHD Panel PC (All-in-One)',
            },
            {
                code: "EV8-WP-AIO21-1",
                product: '21,5" FullHD Panel PC (All-in-One)',
            },
            {
                code: "EV8-KSK-BASE1",
                product: "eValue8 modulaire kiosk",
            },
            {
                code: "EV8-KSK-STD1",
                product: "eValue8 Standaard kiosk VESA",
            },
            {
                code: "EV8-KSK-PRNT1",
                product:
                    "Thermische printer t.b.v. eValue8 modulaire kiosk",
            },
            {
                code: "CBL-PCAV1",
                product: "Kabelset (1 meter)",
            },
        ],
    },
    {
        titel: "Software & setup",
        producten: [
            {
                code: "EV8-DS-STP",
                product: "Setup Narrowcasting/CMS",
            },
            {
                code: "EV8-DS-SW",
                product:
                    "Narrowcasting Speler Software (Windows)",
            },
            {
                code: "QPC-STP",
                product:
                    "Setup QMS, koppeling Narrowcasting",
            },
            {
                code: "QPC-BSFT",
                product: "QMS Baliesoftware",
            },
            {
                code: "STP-MOD",
                product: "Setup Module",
            },
            {
                code: "PCAV-MSC",
                product: "eValue8 registerpagina",
            },
        ],
    },
    {
        titel: "Installatie",
        producten: [
            {
                code: "INST-DS-WKS",
                product:
                    "Complete installatie Wachtkamerschermen Narrowcasting",
            },
            {
                code: "INST-DS-SCRN",
                product: "Complete installatie scherm",
            },
            {
                code: "INST-DS-PLYR",
                product: "Installatie player (op bestaand scherm)",
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
                code: "INST-QM-DISP-10M",
                product:
                    "Installatie Queue Management Kiosk max. 10m",
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
                code: "INST-DS-DSPL",
                product:
                    "Aansluiten extra scherm (i.c.m. volledige installatie)",
            },
            {
                code: "INST-DS-SWAP",
                product:
                    "Omwisselen scherm/player op bestaande installatie",
            },
            {
                code: "INST-DS-PROJ",
                product:
                    "Project/Collectief complete installatie Narrowcasting",
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
                code: "INST-VOOR",
                product: "Voorrijdtarief Installateur",
            },
            {
                code: "INST-VERW",
                product: "Afvoerkosten materialen",
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
                code: "MDB-MBEUG",
                product: "Muurbeugel 26-63 inch",
            },
            {
                code: "EV8-VESA-P-AIO1",
                product:
                    "VESA Portrait beugel t.b.v. AIO Panel PC's",
            },
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
                code: "QPC-THRM",
                product: "Thermische rollen (5 stuks)",
            },
            {
                code: "QPC-THRM-WKS",
                product:
                    "Thermische Wachtkamerscherm rollen (5 stuks)",
            },
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

export { isEvalue8Opdrachtgever } from "@/lib/aanvraag/opdrachtgeverVorm";

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
