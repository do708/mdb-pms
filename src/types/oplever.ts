// Structuur van het opleverformulier, 1-op-1 met het InControl
// opleverdocument van MDB Networks.
//
// Wordt opgeslagen in Workorder.formData (Json).

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
    "Plafondbeugel < 150cm",
    "Plafondbeugel > 150cm",
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
        extraSwitches:boolean | null;
        switchesAantal:string;
        switch5port:string;
        switch8port:string;
        switch5portPoe:string;
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
        opmerkingen:string;
    };

    checklist:{
        werkendOpgeleverd:boolean | null;
        lichtnetSchakelbaar:boolean | null;
        wifiVanToepassing:boolean | null;
        wifiSterkte:"" | "Ja" | "Matig" | "Slecht";
        remoteServices:"" | "Ja" | "Nee" | "n.v.t.";
        locatieMediaplayer:
            "" |
            "Achter het scherm" |
            "In de patchkast" |
            "Boven het plafond" |
            "Kiosk" |
            "Anders";
        aantalMediaplayers:string;
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
    };

    // Per-opdrachtgever extra velden (dynamisch, afhankelijk van klant)
    custom:Record<string,unknown>;

}


export interface HardwareRegel {
    actie:"" | "Geïnstalleerd" | "Gedemonteerd";
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
            extraSwitches:null,
            switchesAantal:"",
            switch5port:"",
            switch8port:"",
            switch5portPoe:"",
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
            opmerkingen:""
        },

        checklist:{
            werkendOpgeleverd:null,
            lichtnetSchakelbaar:null,
            wifiVanToepassing:null,
            wifiSterkte:"",
            remoteServices:"",
            locatieMediaplayer:"",
            aantalMediaplayers:"",
            afvalverwijdering:null
        },

        hardware:[],

        afronding:{
            vervolgafspraken:"",
            meerwerkMateriaal:"",
            meerwerkInOpdrachtVan:"",
            netwerkGecontroleerdDoor:"",
            contactpersoon:""
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
            ...data.materialen
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
                merk:
                    typeof h.merk === "string" ? h.merk : "",
                type:
                    typeof h.type === "string" ? h.type : "",
                serienummer:
                    typeof h.serienummer === "string" ? h.serienummer : "",
                macAddress:
                    typeof h.macAddress === "string" ? h.macAddress : ""
            }))
            :
            [],

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




    return merged;

}
