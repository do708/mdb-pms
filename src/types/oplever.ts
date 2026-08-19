// Structuur van het opleverformulier, 1-op-1 met het InControl
// opleverdocument van MDB Networks.
//
// Wordt opgeslagen in Workorder.formData (Json).

import {
    ExtraDiensten,
    InstallatieRuimte,
    InstallatieScherm,
    StroomInternetBlok,
    emptyExtra,
    emptyRuimte,
    emptyScherm,
    emptyStroomInternet,
    normalizeMac,
    normalizeP25WandTraject,
} from "@/types/installatieRuimtes";

export const OPDRACHTGEVERS = [
    "Axians",
    "Comsysco",
    "Display4All",
    "eValue8",
    "First Impression",
    "Hofcon",
    "HQ Healthcare",
    "IP Care",
    "Marketing in Beeld",
    "MDB Networks",
    "Merit Media",
    "NDI ICT Solutions",
    "Screenlink",
    "TSS Cross Media",
    "Viewie Media",
    "Virupa",
    "ZetaDisplay"
] as const;



export const BEUGEL_TYPES = [
    "Muurbeugel",
    "Zwenkbeugel",
    "Plafondbeugel 150 cm",
    "Plafondbeugel 300 cm",
    "Vloerstandaard",
    "Etalagescherm",
    "Anders"
] as const;


export const SCHERM_FORMATEN = [
    "32\"",
    "42\"",
    "50\"",
    "55\"",
    "65\"",
    "75\"",
    "86\"",
    "98\"",
    "Anders"
] as const;



export interface SchermBlok {

    status:"" | "Nieuw gemonteerd" | "Hergebruikt gemonteerd" | "Gedemonteerd";

    formaat:string;

    formaatAnders:string;

    tilhulp:boolean | null;

    aantal:string;

    orientatie:"" | "Landscape" | "Portrait";

    typeBeugel:string;

    beugelAnders:string;

    bekabeling:string;

    aantalIngesteld:string;

}



export interface ExtraKosten {

    actief:boolean;

    kosten:string;

    voorgeschoten:boolean | null;

}



export interface OpleverData {

    opdrachtgever:string;

    tarief:{
        voorrijtarief:boolean | null;
        kilometers:string;
        reisuren:string;

        // Monteur 1 is de toegewezen monteur van de werkbon.
        // Monteur 2-4 zijn hier vrij te kiezen, zoals in InControl.
        monteur2:string;
        monteur3:string;
        monteur4:string;

        urenMonteur1:string;
        urenMonteur2:string;
        urenMonteur3:string;
        urenMonteur4:string;

        parkeerkosten:ExtraKosten;
        materiaalkosten:ExtraKosten;
        sejour:ExtraKosten;
    };

    installatie:{
        // Nieuwe ruimtes-hiërarchie (digital signage werkbon)
        ruimtes:InstallatieRuimte[];
        stroomBlok:StroomInternetBlok;
        internetBlok:StroomInternetBlok;
        extra:ExtraDiensten;

        // Oude velden (backward compatible / legacy PDF)
        nieuweSchermen:boolean | null;
        nieuweFormaten:SchermBlok[];

        hergebruikteSchermen:boolean | null;
        hergebruikteFormaten:SchermBlok[];

        videowall:boolean | null;
        videowallStatus:"" | "Geïnstalleerd" | "Gedemonteerd";
        videowallHorizontaal:string;
        videowallVerticaal:string;
        videowallConfiguratie:string;
        videowallFormaat:string;
        videowallFormaatAnders:string;
        videowallAantal:string;
        videowallOrientatie:"" | "Landscape" | "Portrait";

        kiosk:boolean | null;
        kioskStatus:"" | "Geïnstalleerd" | "Gedemonteerd";
        kioskOmschrijving:string;
        kioskAantal:string;
        kioskBlokken:KioskBlok[];

        mediaplayers:"" | "Geïnstalleerd" | "Gedemonteerd";
        aantalMediaplayers:string;

        audio:boolean | null;
        audioStatus:"" | "Geïnstalleerd" | "Gedemonteerd";
        audioSpeler:string;
        audioVersterker:string;
        audioVolumeregelaar:string;
        audioSpeakers:string;
        audioAndersTekst:string;
        audioAndersAantal:string;
        audioOmschrijving:string;
        audioAantal:string;

        isProject:boolean | null;
        projectNummer:string;

        opmerkingen:string;
    };

    materialen:{
        nieuweBeugels:boolean | null;
        bestaandeBeugels:boolean | null;
        muurbeugel:string;
        zwenkbeugel:string;
        plafond150:string;
        plafond300:string;
        vloerstandaard:string;
        overigBeugel:string;
        extraHdmiKabels:boolean | null;
        extraHdmiSplitters:boolean | null;
        extraPatchkabels:boolean | null;
        patch1:string;
        patch2:string;
        patch3:string;
        patch5:string;
        patch75:string;
        patch10:string;
        hdmiKabelsAantal:string;
        hdmiSplittersAantal:string;
        hdmi1m:string;
        hdmi2m:string;
        hdmi3m:string;
        hdmi5m:string;
        hdmi75m:string;
        hdmi10m:string;
        hdmiSplitter1x2:string;
        hdmiSplitter1x4:string;
        hdmiSplitter1x2Sn:string[];
        hdmiSplitter1x4Sn:string[];
        extraSwitches:boolean | null;
        switchesAantal:string;
        switch5port:string;
        switch8port:string;
        switch5portPoe:string;
        switchSerienummer:string;
        switch5portSn:string[];
        switch8portSn:string[];
        switch5portPoeSn:string[];
        utpGetrokken:boolean | null;
        utpAantal:string;
        utpType2:string;
        utpType3:string;
        utpType4:string;
        utpType5:string;
        utpType6:string;
        utpType7:string;
        stroomkabelGetrokken:boolean | null;
        stroomAantal:string;
        stroomType1:string;
        stroomType2:string;
        stroomType3:string;
        verlengsnoeren:boolean | null;
        verleng15:string;
        verleng3:string;
        verleng5:string;
        extraSpeakers:boolean | null;
        speakersAantal:string;
        usbSpeakers:string;
        rs232_1m:string;
        rs232_5m:string;
        rs232_10m:string;
        multicast:boolean | null;
        multicastZenders:string;
        multicastOntvangers:string;
        multicastZenderSn:string;
        multicastOntvangerSn:string;
        multicastZenderSns:string[];
        multicastOntvangerSns:string[];
        opmerkingen:string;
    };

    checklist:{
        werkendOpgeleverd:boolean | null;
        redenWerkend:string;
        lichtnetSchakelbaar:boolean | null;
        redenLichtnet:string;
        wifiVanToepassing:boolean | null;
        wifiSterkte:"" | "Ja" | "Matig" | "Slecht";
        remoteServices:"" | "Ja" | "Nee" | "n.v.t.";
        redenRemote:string;
        locatieMediaplayer:
            "" |
            "Achter het scherm" |
            "In de patchkast" |
            "Boven het plafond" |
            "Kiosk" |
            "Anders";
        aantalMediaplayers:string;
        mediaplayerLocaties:Record<string,string>;
        afvalverwijdering:boolean | null;
    };

    // Hardware geïnstalleerd / gedemonteerd (tabel)
    hardware:HardwareRegel[];

    // Afronding / oplevering
    afronding:{
        vervolgafspraken:string;
        meerwerkMateriaal:string;
        meerwerkInOpdrachtVan:string;
        netwerkGecontroleerdDoor:string;
        contactpersoon:string;
        werkzaamhedenGereed:"" | "gereed" | "niet_gereed";
        nietGereedOmschrijving:string;
        handtekening:string;
    };

    // eValue8-installatieregels (aanvinken + aantal per item).
    evalue8:Record<string,EValue8Item>;

    // eValue8: spare player geïnstalleerd? Zo ja: aantallen per type +
    // of er een melding bij eValue8 is gemaakt.
    evalue8SparePlayer:boolean | null;
    evalue8SpareBtr5:string;
    evalue8SpareGd:string;
    evalue8SpareKiosk156:string;
    evalue8SpareKiosk21:string;
    evalue8SpareMelding:boolean | null;

    // Klaargezet materiaal (bij het klaarzetten van de werkbon ingevuld).
    // Pakbon-upload + per soort aantal/omschrijving; status via
    // geleverd+klaargezet óf op locatie.
    klaarzetMateriaal:{
        pakbonUrl:string;
        schermenAantal:string;
        schermenGeleverd:boolean;
        schermenGeprepareerd:boolean;
        schermenKlaargezet:boolean;
        schermenOpLocatie:boolean;
        playersAantal:string;
        playersGeleverd:boolean;
        playersKlaargezet:boolean;
        playersOpLocatie:boolean;
        beugelsAantal:string;
        beugelsGeleverd:boolean;
        beugelsKlaargezet:boolean;
        beugelsOpLocatie:boolean;
        kioskAantal:string;
        kioskGeleverd:boolean;
        kioskKlaargezet:boolean;
        kioskOpLocatie:boolean;
        versterkersAantal:string;
        versterkersGeleverd:boolean;
        versterkersKlaargezet:boolean;
        versterkersOpLocatie:boolean;
    };

    // Per-opdrachtgever extra velden (dynamisch, afhankelijk van klant)
    custom:Record<string,unknown>;

}


// Eén aanvinkbare eValue8-regel met een aantal.
export interface EValue8Item {
    aan:boolean;
    aantal:string;
}


export interface HardwareRegel {
    actie:"" | "Geïnstalleerd" | "Gedemonteerd";
    benaming:string;
    merk:string;
    type:string;
    serienummer:string;
    macAddress:string;
}




export interface KioskBlok {
    status:"" | "Geïnstalleerd" | "Gedemonteerd";
    omschrijving:string;
    aantal:string;
}


export function emptyKioskBlok():KioskBlok {
    return {
        status:"",
        omschrijving:"",
        aantal:""
    };
}


export function emptySchermBlok():SchermBlok {

    return {
        status:"",
        formaat:"",
        formaatAnders:"",
        tilhulp:null,
        aantal:"",
        orientatie:"",
        typeBeugel:"",
        beugelAnders:"",
        bekabeling:"",
        aantalIngesteld:""
    };

}



export function emptyExtraKosten():ExtraKosten {

    return {
        actief:false,
        kosten:"",
        voorgeschoten:null
    };

}



export function emptyOpleverData():OpleverData {

    return {

        opdrachtgever:"",

        tarief:{
            voorrijtarief:null,
            kilometers:"",
            reisuren:"",
            monteur2:"",
            monteur3:"",
            monteur4:"",
            urenMonteur1:"",
            urenMonteur2:"",
            urenMonteur3:"",
            urenMonteur4:"",
            parkeerkosten:emptyExtraKosten(),
            materiaalkosten:emptyExtraKosten(),
            sejour:emptyExtraKosten()
        },

        installatie:{
            ruimtes:[emptyRuimte()],
            stroomBlok:emptyStroomInternet(),
            internetBlok:emptyStroomInternet(),
            extra:emptyExtra(),
            nieuweSchermen:null,
            nieuweFormaten:[],
            hergebruikteSchermen:null,
            hergebruikteFormaten:[],
            videowall:null,
            videowallStatus:"",
            videowallHorizontaal:"",
            videowallVerticaal:"",
            videowallConfiguratie:"",
            videowallFormaat:"",
            videowallFormaatAnders:"",
            videowallAantal:"",
            videowallOrientatie:"",
            kiosk:null,
            kioskStatus:"",
            kioskOmschrijving:"",
            kioskAantal:"",
            kioskBlokken:[],
            mediaplayers:"",
            aantalMediaplayers:"",
            audio:null,
            audioStatus:"",
            audioSpeler:"",
            audioVersterker:"",
            audioVolumeregelaar:"",
            audioSpeakers:"",
            audioAndersTekst:"",
            audioAndersAantal:"",
            audioOmschrijving:"",
            audioAantal:"",
            isProject:null,
            projectNummer:"",
            opmerkingen:""
        },

        materialen:{
            nieuweBeugels:null,
            bestaandeBeugels:null,
            muurbeugel:"",
            zwenkbeugel:"",
            plafond150:"",
            plafond300:"",
            vloerstandaard:"",
            overigBeugel:"",
            extraHdmiKabels:null,
            extraHdmiSplitters:null,
            extraPatchkabels:null,
            patch1:"",
            patch2:"",
            patch3:"",
            patch5:"",
            patch75:"",
            patch10:"",
            hdmiKabelsAantal:"",
            hdmiSplittersAantal:"",
            hdmi1m:"",
            hdmi2m:"",
            hdmi3m:"",
            hdmi5m:"",
            hdmi75m:"",
            hdmi10m:"",
            hdmiSplitter1x2:"",
            hdmiSplitter1x4:"",
            hdmiSplitter1x2Sn:[],
            hdmiSplitter1x4Sn:[],
            extraSwitches:null,
            switchesAantal:"",
            switch5port:"",
            switch8port:"",
            switch5portPoe:"",
            switchSerienummer:"",
            switch5portSn:[],
            switch8portSn:[],
            switch5portPoeSn:[],
            utpGetrokken:null,
            utpAantal:"",
            utpType2:"",
            utpType3:"",
            utpType4:"",
            utpType5:"",
            utpType6:"",
            utpType7:"",
            stroomkabelGetrokken:null,
            stroomAantal:"",
            stroomType1:"",
            stroomType2:"",
            stroomType3:"",
            verlengsnoeren:null,
            verleng15:"",
            verleng3:"",
            verleng5:"",
            extraSpeakers:null,
            speakersAantal:"",
            usbSpeakers:"",
            rs232_1m:"",
            rs232_5m:"",
            rs232_10m:"",
            multicast:null,
            multicastZenders:"",
            multicastOntvangers:"",
            multicastZenderSn:"",
            multicastOntvangerSn:"",
            multicastZenderSns:[],
            multicastOntvangerSns:[],
            opmerkingen:""
        },

        checklist:{
            werkendOpgeleverd:null,
            redenWerkend:"",
            lichtnetSchakelbaar:null,
            redenLichtnet:"",
            wifiVanToepassing:null,
            wifiSterkte:"",
            remoteServices:"",
            redenRemote:"",
            locatieMediaplayer:"",
            aantalMediaplayers:"",
            mediaplayerLocaties:{},
            afvalverwijdering:null
        },

        hardware:[],

        afronding:{
            vervolgafspraken:"",
            meerwerkMateriaal:"",
            meerwerkInOpdrachtVan:"",
            netwerkGecontroleerdDoor:"",
            contactpersoon:"",
            werkzaamhedenGereed:"",
            nietGereedOmschrijving:"",
            handtekening:""
        },

        evalue8:{},

        evalue8SparePlayer:null,
        evalue8SpareBtr5:"",
        evalue8SpareGd:"",
        evalue8SpareKiosk156:"",
        evalue8SpareKiosk21:"",
        evalue8SpareMelding:null,

        klaarzetMateriaal:{
            pakbonUrl:"",
            schermenAantal:"",
            schermenGeleverd:false,
            schermenGeprepareerd:false,
            schermenKlaargezet:false,
            schermenOpLocatie:false,
            playersAantal:"",
            playersGeleverd:false,
            playersKlaargezet:false,
            playersOpLocatie:false,
            beugelsAantal:"",
            beugelsGeleverd:false,
            beugelsKlaargezet:false,
            beugelsOpLocatie:false,
            kioskAantal:"",
            kioskGeleverd:false,
            kioskKlaargezet:false,
            kioskOpLocatie:false,
            versterkersAantal:"",
            versterkersGeleverd:false,
            versterkersKlaargezet:false,
            versterkersOpLocatie:false
        },

        custom:{}

    };

}




// Bestaand (deels ingevuld of ouder) formData veilig samenvoegen
// met de defaults, inclusief migratie van de eerste formData-versie
// (losse schermvelden en vrije tekst voor videowall/kiosk/audio).
export function mergeOpleverData(
    stored:unknown
):OpleverData {


    const empty =
        emptyOpleverData();


    if(
        !stored ||
        typeof stored !== "object"
    ){
        return empty;
    }


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = stored as any;


    const merged:OpleverData = {

        opdrachtgever:
            typeof data.opdrachtgever === "string"
            ?
            data.opdrachtgever
            :
            "",

        tarief:{
            ...empty.tarief,
            ...data.tarief,

            parkeerkosten:{
                ...empty.tarief.parkeerkosten,
                ...data.tarief?.parkeerkosten
            },

            materiaalkosten:{
                ...empty.tarief.materiaalkosten,
                ...(
                    typeof data.tarief?.materiaalkosten === "object"
                    ?
                    data.tarief.materiaalkosten
                    :
                    {}
                )
            },

            sejour:{
                ...empty.tarief.sejour,
                ...data.tarief?.sejour
            }
        },

        installatie:{
            ...empty.installatie,
            ...data.installatie,

            ruimtes:
                Array.isArray(data.installatie?.ruimtes) &&
                data.installatie.ruimtes.length > 0
                ?
                data.installatie.ruimtes.map(
                    (r:Partial<InstallatieRuimte>)=>({
                        ...emptyRuimte(),
                        ...r,
                        schermen:
                            Array.isArray(r.schermen) && r.schermen.length > 0
                            ?
                            r.schermen.map(
                                (s:Partial<InstallatieScherm>, i:number)=>{
                                    const merged = {
                                        ...emptyScherm(i),
                                        ...s
                                    };
                                    const ori = String(merged.orientatie || "");
                                    if(ori === "landscape") merged.orientatie = "Landscape";
                                    if(ori === "portrait") merged.orientatie = "Portrait";
                                    merged.stroomTraject = normalizeP25WandTraject(
                                        merged.stroomTraject || ""
                                    );
                                    merged.internetTraject = normalizeP25WandTraject(
                                        merged.internetTraject || ""
                                    );
                                    merged.mac = normalizeMac(merged.mac || "");
                                    merged.playerMac = normalizeMac(merged.playerMac || "");
                                    if(!merged.locatie && r.naam){
                                        merged.locatie = r.naam;
                                    }
                                    if(!merged.beugel && r.beugelType){
                                        const map:{[k:string]:string} = {
                                            wand_vast:"Muurbeugel",
                                            wand_kantelbaar:"Muurbeugel",
                                            zwenk:"Muurbeugel",
                                            plafond:"Plafondbeugel",
                                            vloerstandaard:"Vloerstandaard",
                                            geen:"Specials"
                                        };
                                        merged.beugel = map[r.beugelType] || "";
                                    }
                                    return merged;
                                }
                            )
                            :
                            [emptyScherm(0)]
                    })
                )
                :
                [emptyRuimte()],

            stroomBlok:{
                ...emptyStroomInternet(),
                ...(data.installatie?.stroomBlok || {})
            },

            internetBlok:{
                ...emptyStroomInternet(),
                ...(data.installatie?.internetBlok || {})
            },

            extra:{
                ...emptyExtra(),
                ...(data.installatie?.extra || {})
            },

            nieuweFormaten:
                Array.isArray(data.installatie?.nieuweFormaten)
                ?
                data.installatie.nieuweFormaten.map(
                    (blok:Partial<SchermBlok>)=>({
                        ...emptySchermBlok(),
                        ...blok
                    })
                )
                :
                [],

            hergebruikteFormaten:
                Array.isArray(data.installatie?.hergebruikteFormaten)
                ?
                data.installatie.hergebruikteFormaten.map(
                    (blok:Partial<SchermBlok>)=>({
                        ...emptySchermBlok(),
                        ...blok
                    })
                )
                :
                [],

            kioskBlokken:
                Array.isArray(data.installatie?.kioskBlokken)
                ?
                data.installatie.kioskBlokken.map(
                    (blok:Partial<KioskBlok>)=>({
                        ...emptyKioskBlok(),
                        ...blok
                    })
                )
                :
                []
        },

        materialen:{
            ...empty.materialen,
            ...data.materialen,
            ...mergeMateriaalSerienummers(data.materialen)
        },

        checklist:{
            ...empty.checklist,
            ...data.checklist
        },

        afronding:{
            ...empty.afronding,
            ...(
                data.afronding &&
                typeof data.afronding === "object"
                ?
                data.afronding
                :
                {}
            )
        },

        hardware:
            Array.isArray(data.hardware)
            ?
            data.hardware.map((h:Record<string,unknown>)=>({
                actie:
                    typeof h.actie === "string" ? h.actie as HardwareRegel["actie"] : "",
                benaming:
                    typeof h.benaming === "string" ? h.benaming : "",
                merk:
                    typeof h.merk === "string" ? h.merk : "",
                type:
                    typeof h.type === "string" ? h.type : "",
                serienummer:
                    typeof h.serienummer === "string" ? h.serienummer : "",
                macAddress:
                    typeof h.macAddress === "string"
                    ? normalizeMac(h.macAddress)
                    : ""
            }))
            :
            [],

        evalue8:(
            data.evalue8 &&
            typeof data.evalue8 === "object"
            ?
            data.evalue8 as Record<string,EValue8Item>
            :
            {}
        ),

        evalue8SparePlayer:(
            typeof data.evalue8SparePlayer === "boolean"
            ?
            data.evalue8SparePlayer
            :
            null
        ),

        evalue8SpareBtr5:(
            typeof data.evalue8SpareBtr5 === "string" ? data.evalue8SpareBtr5 : ""
        ),
        evalue8SpareGd:(
            typeof data.evalue8SpareGd === "string" ? data.evalue8SpareGd : ""
        ),
        evalue8SpareKiosk156:(
            typeof data.evalue8SpareKiosk156 === "string" ? data.evalue8SpareKiosk156 : ""
        ),
        evalue8SpareKiosk21:(
            typeof data.evalue8SpareKiosk21 === "string" ? data.evalue8SpareKiosk21 : ""
        ),
        evalue8SpareMelding:(
            typeof data.evalue8SpareMelding === "boolean" ? data.evalue8SpareMelding : null
        ),

        klaarzetMateriaal:{
            ...empty.klaarzetMateriaal,
            ...(
                data.klaarzetMateriaal &&
                typeof data.klaarzetMateriaal === "object"
                ?
                data.klaarzetMateriaal
                :
                {}
            )
        },

        custom:{
            ...empty.custom,
            ...(
                data.custom &&
                typeof data.custom === "object"
                ?
                data.custom
                :
                {}
            )
        }

    };




    // ---- migratie vanaf de eerste formData-versie ----

    const installatieOud = data.installatie ?? {};


    // v1: hotelSejour (string) -> sejour-blok
    if(
        typeof data.tarief?.hotelSejour === "string" &&
        data.tarief.hotelSejour
    ){

        merged.tarief.sejour = {
            actief:true,
            kosten:data.tarief.hotelSejour,
            voorgeschoten:null
        };

    }


    // v1: materiaalkosten als string -> blok
    if(
        typeof data.tarief?.materiaalkosten === "string" &&
        data.tarief.materiaalkosten
    ){

        merged.tarief.materiaalkosten = {
            actief:true,
            kosten:data.tarief.materiaalkosten,
            voorgeschoten:null
        };

    }


    // v1: parkeerkosten als string -> blok
    if(
        typeof data.tarief?.parkeerkosten === "string"
    ){

        merged.tarief.parkeerkosten =
            data.tarief.parkeerkosten
            ?
            {
                actief:true,
                kosten:data.tarief.parkeerkosten,
                voorgeschoten:null
            }
            :
            emptyExtraKosten();

    }


    // v1: losse schermvelden -> eerste blok
    if(
        typeof installatieOud.schermFormaat === "string" &&
        (
            installatieOud.schermFormaat ||
            installatieOud.aantalSchermen
        ) &&
        merged.installatie.nieuweFormaten.length === 0
    ){

        const blok:SchermBlok = {

            status:"",

            formaat:
                installatieOud.schermFormaat ?? "",

            formaatAnders:"",

            tilhulp:
                installatieOud.tilhulp ?? null,

            aantal:
                installatieOud.aantalSchermen ?? "",

            orientatie:
                installatieOud.orientatie ?? "",

            typeBeugel:
                installatieOud.typeBeugel ?? "",

            beugelAnders:"",

            bekabeling:"",

            aantalIngesteld:
                installatieOud.aantalIngesteld ?? ""

        };


        if(merged.installatie.hergebruikteSchermen === true){

            merged.installatie.hergebruikteFormaten = [blok];

        } else {

            merged.installatie.nieuweFormaten = [blok];

        }

    }


    // v1: videowall/kiosk/audio als vrije tekst
    if(
        typeof installatieOud.videowall === "string"
    ){

        merged.installatie.videowall =
            installatieOud.videowall ? true : null;

        merged.installatie.videowallConfiguratie =
            installatieOud.videowall;

    }


    if(
        typeof installatieOud.kiosk === "string"
    ){

        merged.installatie.kiosk =
            installatieOud.kiosk ? true : null;

        merged.installatie.kioskOmschrijving =
            installatieOud.kiosk;

    }


    if(
        typeof installatieOud.audio === "string"
    ){

        merged.installatie.audio =
            installatieOud.audio ? true : null;

        merged.installatie.audioOmschrijving =
            installatieOud.audio;

    }




    normalizeOpleverMacs(merged);

    return merged;

}



const MAX_SN_VELDEN = 20;


/** Positief aantal uit een vrije tekst (max. 20 velden). */
export function parseAantal(value:unknown):number {

    const n = parseInt(String(value ?? ""), 10);

    if(!Number.isFinite(n) || n <= 0){
        return 0;
    }

    return Math.min(n, MAX_SN_VELDEN);

}


function asSnArray(value:unknown):string[] {

    if(!Array.isArray(value)){
        return [];
    }

    return value.map((x)=>typeof x === "string" ? x : "");

}


/** N serienummer-slots; oude enkele string komt in het eerste veld. */
export function normalizeSnArray(
    stored:unknown,
    count:number,
    legacy?:unknown
):string[] {

    const fromArr = asSnArray(stored);

    const base =
        fromArr.length > 0
        ? fromArr
        : (
            typeof legacy === "string" && legacy.trim()
            ? [legacy]
            : []
        );

    if(count <= 0){
        return [];
    }

    const next = base.slice(0, count);

    while(next.length < count){
        next.push("");
    }

    return next;

}


export function resizeSnArray(
    arr:string[] | undefined,
    n:number
):string[] {

    return normalizeSnArray(arr, n);

}


function firstFilledSn(arrs:string[][]):string {

    for(const arr of arrs){
        for(const s of arr){
            if(s.trim()){
                return s;
            }
        }
    }

    return "";

}


function mergeMateriaalSerienummers(
    stored:unknown
):Pick<
    OpleverData["materialen"],
    | "hdmiSplitter1x2Sn"
    | "hdmiSplitter1x4Sn"
    | "switch5portSn"
    | "switch8portSn"
    | "switch5portPoeSn"
    | "switchSerienummer"
    | "multicastZenderSns"
    | "multicastOntvangerSns"
    | "multicastZenderSn"
    | "multicastOntvangerSn"
> {

    const raw =
        stored && typeof stored === "object"
        ? stored as Record<string,unknown>
        : {};

    const n1x2 = parseAantal(raw.hdmiSplitter1x2);
    const n1x4 = parseAantal(raw.hdmiSplitter1x4);
    const n5 = parseAantal(raw.switch5port);
    const n8 = parseAantal(raw.switch8port);
    const nPoe = parseAantal(raw.switch5portPoe);
    const nZender = parseAantal(raw.multicastZenders);
    const nOntvanger = parseAantal(raw.multicastOntvangers);

    const storedSwitchArrs = {
        switch5portSn: asSnArray(raw.switch5portSn),
        switch8portSn: asSnArray(raw.switch8portSn),
        switch5portPoeSn: asSnArray(raw.switch5portPoeSn)
    };

    const heeftSwitchArrs =
        storedSwitchArrs.switch5portSn.some((s)=>s.trim())
        || storedSwitchArrs.switch8portSn.some((s)=>s.trim())
        || storedSwitchArrs.switch5portPoeSn.some((s)=>s.trim());

    const legacySwitch =
        typeof raw.switchSerienummer === "string"
        ? raw.switchSerienummer
        : "";

    let switch5portSn = normalizeSnArray(raw.switch5portSn, n5);
    let switch8portSn = normalizeSnArray(raw.switch8portSn, n8);
    let switch5portPoeSn = normalizeSnArray(raw.switch5portPoeSn, nPoe);

    if(!heeftSwitchArrs && legacySwitch.trim()){
        if(n5 > 0){
            switch5portSn = normalizeSnArray([], n5, legacySwitch);
        } else if(n8 > 0){
            switch8portSn = normalizeSnArray([], n8, legacySwitch);
        } else if(nPoe > 0){
            switch5portPoeSn = normalizeSnArray([], nPoe, legacySwitch);
        }
    }

    const multicastZenderSns = normalizeSnArray(
        raw.multicastZenderSns,
        nZender,
        raw.multicastZenderSn
    );
    const multicastOntvangerSns = normalizeSnArray(
        raw.multicastOntvangerSns,
        nOntvanger,
        raw.multicastOntvangerSn
    );

    return {
        hdmiSplitter1x2Sn: normalizeSnArray(raw.hdmiSplitter1x2Sn, n1x2),
        hdmiSplitter1x4Sn: normalizeSnArray(raw.hdmiSplitter1x4Sn, n1x4),
        switch5portSn,
        switch8portSn,
        switch5portPoeSn,
        switchSerienummer:
            firstFilledSn([switch5portSn, switch8portSn, switch5portPoeSn])
            || legacySwitch,
        multicastZenderSns,
        multicastOntvangerSns,
        multicastZenderSn:
            multicastZenderSns.find((s)=>s.trim()) || (
                typeof raw.multicastZenderSn === "string"
                ? raw.multicastZenderSn
                : ""
            ),
        multicastOntvangerSn:
            multicastOntvangerSns.find((s)=>s.trim()) || (
                typeof raw.multicastOntvangerSn === "string"
                ? raw.multicastOntvangerSn
                : ""
            )
    };

}


/** MAC-adressen in het hele opleverformulier naar hoofdletters. */
export function normalizeOpleverMacs(data:OpleverData):OpleverData {

    for(const ruimte of data.installatie.ruimtes){
        for(const scherm of ruimte.schermen){
            scherm.mac = normalizeMac(scherm.mac || "");
            scherm.playerMac = normalizeMac(scherm.playerMac || "");
        }
    }

    for(const h of data.hardware){
        h.macAddress = normalizeMac(h.macAddress || "");
    }

    return data;

}


function tariefFieldEmpty(
    value:string | undefined
):boolean {

    if(!value){
        return true;
    }

    return value.trim().length === 0;

}



/** Kilometers zonder decimalen. */
export function formatKilometers(
    value:number
):string {

    return String(Math.round(value));

}



/**
 * Uren/reistijd als klok: 1.15, 1.30, 1.45, 2, 2.15, …
 * De cijfers na de punt zijn minuten (geen decimale uren).
 */
export function roundToQuarterHourMinutes(
    totalMinutes:number
):number {

    if(totalMinutes <= 0){
        return 0;
    }

    const rounded =
        Math.round(totalMinutes / 15) * 15;

    return rounded;

}



export function normalizeClockParts(
    hours:number,
    minutes:number
):{ hours:number; minutes:number } {

    let h = hours;
    let m = minutes;

    if(m >= 60){
        h += Math.floor(m / 60);
        m = m % 60;
    }

    // Alleen .00 / .15 / .30 / .45; 40–59 (behalve 45) → volgend uur
    if(m === 0 || m === 15 || m === 30 || m === 45){
        return { hours:h, minutes:m };
    }

    if(m >= 40){
        return { hours:h + 1, minutes:0 };
    }

    if(m >= 23){
        return { hours:h, minutes:30 };
    }

    if(m >= 8){
        return { hours:h, minutes:15 };
    }

    return { hours:h, minutes:0 };

}



/** Decimale uren → afronden op kwartier. */
export function roundToClockHours(
    value:number
):number {

    if(value <= 0){
        return 0;
    }

    const minutes =
        roundToQuarterHourMinutes(value * 60);

    return minutes / 60;

}



/** Weergave: 1, 1.15, 1.30, 1.45, 2, … */
export function formatClockHours(
    value:number
):string {

    if(value <= 0){
        return "";
    }

    const totalMinutes =
        roundToQuarterHourMinutes(value * 60);

    const hours =
        Math.floor(totalMinutes / 60);

    const minutes =
        totalMinutes % 60;

    if(minutes === 0){
        return String(hours);
    }

    return `${hours}.${String(minutes).padStart(2, "0")}`;

}



/** @deprecated gebruik formatClockHours */
export function formatReisurenHalfHours(
    value:number
):string {
    return formatClockHours(value);
}



/** @deprecated */
export function roundToHalfHours(
    value:number
):number {
    return roundToClockHours(value);
}



/**
 * Parseert kloknotatie "1.30" (= 1 uur 30 min) en legacy "1,5" / "1 1/2".
 * Geeft decimale uren terug voor berekeningen.
 */
export function parseClockHours(
    value:unknown
):number {

    if(typeof value === "number"){
        return isNaN(value) ? 0 : value;
    }

    if(typeof value !== "string"){
        return 0;
    }

    const cleaned =
        value
        .trim()
        .toLowerCase()
        .replace(/\s*uur(en)?\s*$/i, "")
        .replace("½", " 1/2")
        .trim();

    if(!cleaned){
        return 0;
    }

    const mixed =
        cleaned.match(
            /^(\d+)\s+1\s*\/\s*2$/
        );

    if(mixed){
        return Number(mixed[1]) + 0.5;
    }

    if(cleaned === "1/2"){
        return 0.5;
    }

    const clock =
        cleaned.match(
            /^(\d+)[.,](\d{1,2})$/
        );

    if(clock){

        const hours =
            Number(clock[1]);

        let minutes =
            Number(clock[2]);

        // "1.3" → 1.30; "1.5" → 1.50 als één cijfer
        if(clock[2].length === 1){
            minutes = minutes * 10;
        }

        const normalized =
            normalizeClockParts(hours, minutes);

        return (
            normalized.hours
            + normalized.minutes / 60
        );

    }

    const whole =
        cleaned.match(/^(\d+)$/);

    if(whole){
        return Number(whole[1]);
    }

    const n = parseFloat(
        cleaned.replace(",", ".")
    );

    return isNaN(n) ? 0 : n;

}



/** Alias voor reisuren. */
export function parseReisuren(
    value:unknown
):number {
    return parseClockHours(value);
}



/** Geen automatische km meer; alleen voorrijtarief-regels toepassen. */
export function applyPlannedTravelToFormData(
    stored:unknown,
    _plannedRoundTripKm:number | null | undefined,
    _plannedReisuren:number | null | undefined
):OpleverData {

    const merged =
        mergeOpleverData(stored);

    enforceVoorrijtariefTravelRules(
        merged,
        null,
        null,
        true
    );

    return merged;

}



/** Vast = geen km/reisuren; KM's + Uren = handmatig (geen auto-km uit planning). */
export function enforceVoorrijtariefTravelRules(
    data:OpleverData,
    _plannedRoundTripKm:number | null | undefined,
    _plannedReisuren:number | null | undefined,
    _onlyFillEmptyKm:boolean
):void {

    if(data.tarief.voorrijtarief === true){

        data.tarief.kilometers = "";
        data.tarief.reisuren = "";

    }

}
