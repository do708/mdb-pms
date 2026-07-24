// Structuur van het opleverformulier, gebaseerd op de bestaande
// MDB Networks opleverdocumenten (MIB / Merit Media / Viewie Media).
//
// Wordt opgeslagen in Workorder.formData (Json).

export interface OpleverData {

    tarief:{
        voorrijtarief:boolean | null;
        kilometers:string;
        reisuren:string;
        parkeerkosten:string;
        materiaalkosten:string;
        hotelSejour:string;
    };

    installatie:{
        nieuweSchermen:boolean | null;
        hergebruikteSchermen:boolean | null;
        schermFormaat:string;
        tilhulp:boolean | null;
        aantalSchermen:string;
        orientatie:"" | "Landscape" | "Portrait";
        typeBeugel:string;
        aantalIngesteld:string;
        videowall:string;
        kiosk:string;
        mediaplayers:"" | "Geïnstalleerd" | "Gedemonteerd";
        aantalMediaplayers:string;
        audio:string;
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

}



export function emptyOpleverData():OpleverData {

    return {

        tarief:{
            voorrijtarief:null,
            kilometers:"",
            reisuren:"",
            parkeerkosten:"",
            materiaalkosten:"",
            hotelSejour:""
        },

        installatie:{
            nieuweSchermen:null,
            hergebruikteSchermen:null,
            schermFormaat:"",
            tilhulp:null,
            aantalSchermen:"",
            orientatie:"",
            typeBeugel:"",
            aantalIngesteld:"",
            videowall:"",
            kiosk:"",
            mediaplayers:"",
            aantalMediaplayers:"",
            audio:"",
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
        }

    };

}



// Bestaand (deels ingevuld) formData veilig samenvoegen met de defaults,
// zodat nieuwe velden nooit undefined zijn.
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

    const data =
        stored as Partial<OpleverData>;

    return {

        tarief:{
            ...empty.tarief,
            ...data.tarief
        },

        installatie:{
            ...empty.installatie,
            ...data.installatie
        },

        materialen:{
            ...empty.materialen,
            ...data.materialen
        },

        checklist:{
            ...empty.checklist,
            ...data.checklist
        }

    };

}
