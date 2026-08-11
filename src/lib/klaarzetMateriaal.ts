// Controle op het "klaargezet materiaal"-blok van een werkbon.
//
// Regel: per soort (Schermen, Players, Beugels, …) geldt dat als het
// aantal/omschrijving-tekstvak is ingevuld, ofwel "Op locatie" moet staan,
// ofwel "Geleverd" én "Klaargezet". Is het tekstvak leeg, dan is die soort
// n.v.t. en hoeft er niets aangevinkt te worden.
//
// De klus is "compleet gecontroleerd" als alle ingevulde soorten in orde zijn.

import {
    klaarzetVanAanvraagSpecificaties,
    mergeKlaarzetPrefill,
} from "@/lib/aanvraag/klaarzetVanSpecificaties";
import { aansturingWeergave } from "@/lib/aanvraag/installatieTypes";

export interface KlaarzetMateriaal {
    schermenAantal?:string;
    schermenGeleverd?:boolean;
    /** Alleen relevant bij Tizen / webOS / Android. */
    schermenGeprepareerd?:boolean;
    schermenKlaargezet?:boolean;
    schermenOpLocatie?:boolean;
    playersAantal?:string;
    playersGeleverd?:boolean;
    playersKlaargezet?:boolean;
    playersOpLocatie?:boolean;
    beugelsAantal?:string;
    beugelsGeleverd?:boolean;
    beugelsKlaargezet?:boolean;
    beugelsOpLocatie?:boolean;
    kioskAantal?:string;
    kioskGeleverd?:boolean;
    kioskKlaargezet?:boolean;
    kioskOpLocatie?:boolean;
    versterkersAantal?:string;
    versterkersGeleverd?:boolean;
    versterkersKlaargezet?:boolean;
    versterkersOpLocatie?:boolean;
}

/** Aansturing waarbij schermen zelf geprepareerd moeten worden (geen Player). */
export const NATIVE_OS_AANSTURING = [
    "Tizen",
    "webOS",
    "Android",
] as const;

export type NativeOsAansturing = (typeof NATIVE_OS_AANSTURING)[number];

export type MateriaalSoortKey =
    | "schermen"
    | "players"
    | "beugels"
    | "kiosk"
    | "versterkers";

export interface MateriaalRegelStatus {
    key:MateriaalSoortKey;
    label:string;
    aantal:string;
    geleverd:boolean;
    geprepareerd:boolean | null;
    klaargezet:boolean;
    opLocatie:boolean;
    inOrde:boolean;
    /** Schermen met native OS: binnengekomen → geprepareerd → klaargezet. */
    nativeOsFlow:boolean;
}

export interface MateriaalCheckOpties {
    /** True als minstens één scherm Tizen / webOS / Android heeft. */
    heeftNativeOs?:boolean;
}

export interface SchermAansturingInfo {
    /** Unieke aansturing-labels (incl. Anders-toelichting). */
    labels:string[];
    /** True als minstens één scherm Tizen / webOS / Android heeft. */
    heeftNativeOs:boolean;
}


function regelInOrde(
    aantal:string | undefined,
    geleverd:boolean | undefined,
    klaargezet:boolean | undefined,
    opLocatie?:boolean | undefined,
    opts?:{
        requireGeprepareerd?:boolean;
        geprepareerd?:boolean | undefined;
    }
):boolean {

    const ingevuld =
        typeof aantal === "string" && aantal.trim() !== "";

    // Leeg tekstvak => n.v.t. => in orde.
    if(!ingevuld){
        return true;
    }

    // Ingevuld => op locatie, of geleverd (+ geprepareerd) + klaargezet.
    if(opLocatie){
        return true;
    }

    if(opts?.requireGeprepareerd && !Boolean(opts.geprepareerd)){
        return false;
    }

    return Boolean(geleverd) && Boolean(klaargezet);

}


// Haalt het materiaal-blok veilig uit de (onbekende) formData van een werkbon.
export function leesKlaarzetMateriaal(
    formData:unknown
):KlaarzetMateriaal | null {

    if(
        !formData ||
        typeof formData !== "object"
    ){
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const km = (formData as any).klaarzetMateriaal;

    if(
        !km ||
        typeof km !== "object"
    ){
        return null;
    }

    return km as KlaarzetMateriaal;

}


// Is er minstens één soort ingevuld? (Anders valt er niets te controleren.)
export function heeftMateriaal(
    km:KlaarzetMateriaal | null
):boolean {

    if(!km){
        return false;
    }

    return Boolean(
        (km.schermenAantal && km.schermenAantal.trim()) ||
        (km.playersAantal && km.playersAantal.trim()) ||
        (km.beugelsAantal && km.beugelsAantal.trim()) ||
        (km.kioskAantal && km.kioskAantal.trim()) ||
        (km.versterkersAantal && km.versterkersAantal.trim())
    );

}


// Is het materiaal-blok compleet (alle ingevulde soorten in orde)?
// Let op: null/leeg telt hier als "compleet" voor waarschuwingen (niets
// te checken). Materiaal-controle toont lege ingeplande klussen wél —
// daar is leeg juist "nog te controleren".
export function materiaalCompleet(
    km:KlaarzetMateriaal | null,
    opties:MateriaalCheckOpties = {}
):boolean {

    if(!km){
        // Niets ingevuld => niets te controleren => geen waarschuwing.
        return true;
    }

    const nativeSchermen = Boolean(opties.heeftNativeOs);

    return (
        regelInOrde(
            km.schermenAantal,
            km.schermenGeleverd,
            km.schermenKlaargezet,
            km.schermenOpLocatie,
            nativeSchermen
                ? {
                    requireGeprepareerd:true,
                    geprepareerd:km.schermenGeprepareerd,
                }
                : undefined
        ) &&
        regelInOrde(km.playersAantal, km.playersGeleverd, km.playersKlaargezet, km.playersOpLocatie) &&
        regelInOrde(km.beugelsAantal, km.beugelsGeleverd, km.beugelsKlaargezet, km.beugelsOpLocatie) &&
        regelInOrde(km.kioskAantal, km.kioskGeleverd, km.kioskKlaargezet, km.kioskOpLocatie) &&
        regelInOrde(km.versterkersAantal, km.versterkersGeleverd, km.versterkersKlaargezet, km.versterkersOpLocatie)
    );

}


const SOORT_DEFS:[
    MateriaalSoortKey,
    string,
    keyof KlaarzetMateriaal,
    keyof KlaarzetMateriaal,
    keyof KlaarzetMateriaal,
    keyof KlaarzetMateriaal
][] = [
    ["schermen", "Schermen", "schermenAantal", "schermenGeleverd", "schermenKlaargezet", "schermenOpLocatie"],
    ["players", "Players", "playersAantal", "playersGeleverd", "playersKlaargezet", "playersOpLocatie"],
    ["beugels", "Beugels", "beugelsAantal", "beugelsGeleverd", "beugelsKlaargezet", "beugelsOpLocatie"],
    ["kiosk", "Kiosk", "kioskAantal", "kioskGeleverd", "kioskKlaargezet", "kioskOpLocatie"],
    ["versterkers", "Versterker/speakers", "versterkersAantal", "versterkersGeleverd", "versterkersKlaargezet", "versterkersOpLocatie"],
];


/** Alle ingevulde materiaalregels met status (voor controle/print). */
export function materiaalRegels(
    km:KlaarzetMateriaal | null,
    opties:MateriaalCheckOpties = {}
):MateriaalRegelStatus[] {

    if(!km){
        return [];
    }

    const regels:MateriaalRegelStatus[] = [];
    const nativeSchermen = Boolean(opties.heeftNativeOs);

    for(const [key, label, aantalKey, gelKey, klaarKey, locKey] of SOORT_DEFS){
        const aantalRaw = km[aantalKey];
        const aantal =
            typeof aantalRaw === "string" ? aantalRaw.trim() : "";

        if(!aantal){
            continue;
        }

        const geleverd = Boolean(km[gelKey]);
        const klaargezet = Boolean(km[klaarKey]);
        const opLocatie = Boolean(km[locKey]);
        const nativeOsFlow = key === "schermen" && nativeSchermen;
        const geprepareerd = nativeOsFlow
            ? Boolean(km.schermenGeprepareerd)
            : null;

        regels.push({
            key,
            label,
            aantal,
            geleverd,
            geprepareerd,
            klaargezet,
            opLocatie,
            nativeOsFlow,
            inOrde:regelInOrde(
                aantal,
                geleverd,
                klaargezet,
                opLocatie,
                nativeOsFlow
                    ? {
                        requireGeprepareerd:true,
                        geprepareerd:km.schermenGeprepareerd,
                    }
                    : undefined
            ),
        });
    }

    return regels;
}


function asRecord(value:unknown):Record<string, unknown> | null {
    if(!value || typeof value !== "object" || Array.isArray(value)){
        return null;
    }
    return value as Record<string, unknown>;
}


function str(value:unknown):string {
    return typeof value === "string" ? value.trim() : "";
}


export function isNativeOsAansturing(value:string):boolean {
    return (NATIVE_OS_AANSTURING as readonly string[]).includes(value);
}


/** Lees aansturing uit aanvraag-snapshot/specificaties. */
export function leesSchermAansturing(
    snapshotOrSpecs:unknown
):SchermAansturingInfo {

    const envelope = asRecord(snapshotOrSpecs);
    const specs =
        asRecord(envelope?.specificaties) || envelope || {};
    const schermen = asRecord(specs.schermen);

    const labels:string[] = [];
    let heeftNativeOs = false;

    if(schermen?.aan && Array.isArray(schermen.items)){
        for(const item of schermen.items){
            const r = asRecord(item);
            if(!r) continue;

            const aansturing = str(r.aansturing);
            if(!aansturing) continue;

            const label =
                aansturing === "Anders"
                ? (str(r.aansturingAnders) || "Anders")
                : aansturingWeergave(aansturing);

            if(!labels.includes(label)){
                labels.push(label);
            }

            if(isNativeOsAansturing(aansturing)){
                heeftNativeOs = true;
            }
        }
    }

    return { labels, heeftNativeOs };
}


/**
 * Effectief klaarzet-materiaal: opgeslagen waarden + prefill uit aanvraag
 * (alleen lege tekstvakken). Zo verschijnen ook klussen die nog niet
 * handmatig zijn voorgevuld op het controle-overzicht.
 */
export function effectiefKlaarzetMateriaal(
    formData:unknown,
    aanvraagSpecificaties:unknown
):KlaarzetMateriaal | null {

    const bestaand = leesKlaarzetMateriaal(formData) || {};
    const prefill =
        klaarzetVanAanvraagSpecificaties(aanvraagSpecificaties);

    const merged = mergeKlaarzetPrefill(
        { ...bestaand } as Record<string, unknown>,
        prefill
    ) as KlaarzetMateriaal;

    return heeftMateriaal(merged) ? merged : null;
}
