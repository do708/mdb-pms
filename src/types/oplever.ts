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
    "Statief",
    "Overig"
] as const;



export interface SchermBlok {

    formaat:string;

    tilhulp:boolean | null;

    aantal:string;

    orientatie:"" | "Landscape" | "Portrait";

    typeBeugel:string;

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
        videowallConfiguratie:string;
        videowallFormaat:string;
        videowallAantal:string;

        kiosk:boolean | null;
        kioskOmschrijving:string;
        kioskAantal:string;

        mediaplayers:"" | "Geïnstalleerd" | "Gedemonteerd";
        aantalMediaplayers:string;

        audio:boolean | null;
        audioOmschrijving:string;
        audioAantal:string;

        isProject:boolean | null;

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
        extraSwitches:boolean | null;
        utpGetrokken:boolean | null;
        stroomkabelGetrokken:boolean | null;
        verlengsnoeren:boolean | null;
        verleng15:string;
        verleng3:string;
        verleng5:string;
        extraSpeakers:boolean | null;
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

    // Hardware geïnstalleerd / ontmanteld (tabel)
    hardware:HardwareRegel[];

    // Per-opdrachtgever extra velden (dynamisch, afhankelijk van klant)
    custom:Record<string,unknown>;

}


export interface HardwareRegel {
    actie:"" | "Geïnstalleerd" | "Ontmanteld";
    merk:string;
    type:string;
    serienummer:string;
}




export function emptySchermBlok():SchermBlok {

    return {
        formaat:"",
        tilhulp:null,
        aantal:"",
        orientatie:"",
        typeBeugel:"",
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
            videowallConfiguratie:"",
            videowallFormaat:"",
            videowallAantal:"",
            kiosk:null,
            kioskOmschrijving:"",
            kioskAantal:"",
            mediaplayers:"",
            aantalMediaplayers:"",
            audio:null,
            audioOmschrijving:"",
            audioAantal:"",
            isProject:null,
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
            extraSwitches:null,
            utpGetrokken:null,
            stroomkabelGetrokken:null,
            verlengsnoeren:null,
            verleng15:"",
            verleng3:"",
            verleng5:"",
            extraSpeakers:null,
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
                    typeof h.serienummer === "string" ? h.serienummer : ""
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

            formaat:
                installatieOud.schermFormaat ?? "",

            tilhulp:
                installatieOud.tilhulp ?? null,

            aantal:
                installatieOud.aantalSchermen ?? "",

            orientatie:
                installatieOud.orientatie ?? "",

            typeBeugel:
                installatieOud.typeBeugel ?? "",

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
