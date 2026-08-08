"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import SchermenSpecificatie from "@/components/aanvraag/SchermenSpecificatie";
import VideowallSpecificatie from "@/components/aanvraag/VideowallSpecificatie";
import KioskSpecificatie from "@/components/aanvraag/KioskSpecificatie";
import AudioSpecificatie from "@/components/aanvraag/AudioSpecificatie";
import Evalue8ProductSpecificatie, {
    Evalue8SelectieState,
} from "@/components/aanvraag/Evalue8ProductSpecificatie";
import { StroomInternetVragen } from "@/components/aanvraag/StroomInternetVragen";
import {
    AanvraagKioskItem,
    AanvraagSchermItem,
    FORMAAT_PASTEL,
    berekendInstallatieType,
    kioskVeldenCompleet,
    samenvattingSchermen,
    samenvattingStroomInternet,
    schermVeldenCompleet,
    syncKioskItems,
    syncSchermItems,
} from "@/lib/aanvraag/installatieTypes";
import {
    evalue8KeuzesVanState,
    isEvalue8Opdrachtgever,
} from "@/lib/aanvraag/evalue8Producten";


interface Bijlage {
    url:string;
    name:string;
}


// Eén onderdeel-blok met detailvelden.
interface SpecBlok {
    aan:boolean;
    velden:Record<string,string>;
}



// Definitie van de zes onderdeel-blokken met hun detailvelden en pastelkleur.
const ONDERDELEN:{
    key:string;
    titel:string;
    kleur:string;
    velden:{ key:string; label:string; plh?:string; opties?:string[]; beugels?:string[]; meerdere?:boolean }[];
}[] = [
    {
        key:"schermen",
        titel:"1. Schermen",
        kleur:"bg-sky-50 border-sky-200",
        // Velden worden via SchermenSpecificatie gerenderd (per scherm).
        velden:[]
    },
    {
        key:"videowall",
        titel:"2. Videowall",
        kleur:"bg-emerald-50 border-emerald-200",
        // Velden via VideowallSpecificatie (LCD/LED).
        velden:[]
    },
    {
        key:"kiosk",
        titel:"3. Kiosk",
        kleur:"bg-amber-50 border-amber-200",
        // Velden via KioskSpecificatie (per kiosk).
        velden:[]
    },
    {
        key:"mediaplayers",
        titel:"4. Mediaplayers",
        kleur:"bg-violet-50 border-violet-200",
        velden:[
            { key:"aantal", label:"Aantal", plh:"Bijv. 2" },
            { key:"opmerking", label:"Opmerking", plh:"Aanvullende details" }
        ]
    },
    {
        key:"audio",
        titel:"5. Audio",
        kleur:"bg-rose-50 border-rose-200",
        // Velden via AudioSpecificatie.
        velden:[]
    }
];



function parseGekozenOpties(waarde:string):string[] {
    if(!waarde.trim()){
        return [];
    }

    return waarde.split(",").map((s)=>s.trim()).filter(Boolean);
}



function AanvraagFormulier(){

    const searchParams =
        useSearchParams();

    const token =
        searchParams.get("client_id") || "";


    const [laden,setLaden] =
        useState(true);

    const [opdrachtgever,setOpdrachtgever] =
        useState("");

    const [linkGeldig,setLinkGeldig] =
        useState(false);


    // Locatie & adres
    const [locatie,setLocatie] = useState("");
    const [straat,setStraat] = useState("");
    const [huisnummer,setHuisnummer] = useState("");
    const [postcode,setPostcode] = useState("");
    const [plaats,setPlaats] = useState("");

    const [contactPersoon,setContactPersoon] = useState("");
    const [contactEmail,setContactEmail] = useState("");
    const [contactPhone,setContactPhone] = useState("");

    // Specificaties (per onderdeel een blok)
    const [specs,setSpecs] =
        useState<Record<string,SpecBlok>>(()=>{
            const start:Record<string,SpecBlok> = {};
            for(const o of ONDERDELEN){
                start[o.key] = { aan:false, velden:{} };
            }
            return start;
        });

    const [schermenItems, setSchermenItems] =
        useState<AanvraagSchermItem[]>([]);

    const [kioskItems, setKioskItems] =
        useState<AanvraagKioskItem[]>([]);

    const [evalue8Selectie, setEvalue8Selectie] =
        useState<Evalue8SelectieState>({});

    const [project,setProject] = useState("");
    const [projectOmschrijving,setProjectOmschrijving] = useState("");
    const [opmerkingen,setOpmerkingen] = useState("");

    const [aanvragerNaam,setAanvragerNaam] = useState("");


    // Type aanvraag: "installatie" | "storing" | "uren"
    const [typeAanvraag,setTypeAanvraag] = useState("");

    // Storing
    const [storingOmschrijving,setStoringOmschrijving] = useState("");
    const [hardwareVervangen,setHardwareVervangen] = useState("");
    const [hardwareBesteld,setHardwareBesteld] = useState("");
    const [hardwareLevering,setHardwareLevering] = useState("");

    // Uren
    const [geschatUren,setGeschatUren] = useState("");
    const [aantalMonteurs,setAantalMonteurs] = useState("");

    const [bijlagen,setBijlagen] =
        useState<Bijlage[]>([]);

    const [uploadBezig,setUploadBezig] =
        useState(false);

    const [sleepActief,setSleepActief] =
        useState(false);


    const [versturenBezig,setVersturenBezig] =
        useState(false);

    const [verstuurd,setVerstuurd] =
        useState(false);

    const [fout,setFout] =
        useState("");



    useEffect(()=>{

        async function laadKlant(){

            if(!token){
                setLinkGeldig(false);
                setLaden(false);
                return;
            }

            try {

                const res =
                    await fetch(`/api/aanvraag/${token}`);

                if(res.ok){
                    const data = await res.json();
                    setOpdrachtgever(data.customerName);
                    setLinkGeldig(true);
                } else {
                    setLinkGeldig(false);
                }

            } catch {
                setLinkGeldig(false);
            }

            setLaden(false);

        }

        laadKlant();

    },[token]);

    const isEvalue8 =
        isEvalue8Opdrachtgever(opdrachtgever);


    function toggleBlok(key:string){
        setSpecs((s)=>({
            ...s,
            [key]:{ ...s[key], aan:!s[key].aan }
        }));
    }

    function zetVeld(blok:string, veld:string, waarde:string){
        setSpecs((s)=>({
            ...s,
            [blok]:{
                ...s[blok],
                velden:{ ...s[blok].velden, [veld]:waarde }
            }
        }));
    }

    function zetVelden(blok:string, patch:Record<string,string>){
        setSpecs((s)=>({
            ...s,
            [blok]:{
                ...s[blok],
                velden:{ ...s[blok].velden, ...patch }
            }
        }));
    }


    function toggleMeerdereOptie(
        blok:string,
        veldKey:string,
        optie:string
    ){
        setSpecs((s)=>{
            const huidig =
                parseGekozenOpties(s[blok].velden[veldKey] || "");

            const volgende =
                huidig.includes(optie)
                ? huidig.filter((o)=>o !== optie)
                : [...huidig, optie];

            const velden:Record<string,string> = {
                ...s[blok].velden,
                [veldKey]: volgende.join(", ")
            };

            if(optie === "Anders" && !volgende.includes("Anders")){
                delete velden.formaatAnders;
            }

            return {
                ...s,
                [blok]:{
                    ...s[blok],
                    velden
                }
            };
        });
    }



    const verwerkBestanden =
        useCallback(async (files:FileList | File[])=>{

            setFout("");
            setUploadBezig(true);

            for(const file of Array.from(files)){

                const isFoto = file.type.startsWith("image/");
                const isPdf = file.type === "application/pdf";

                if(!isFoto && !isPdf){
                    setFout("Alleen foto's en PDF-bestanden zijn toegestaan.");
                    continue;
                }

                const fd = new FormData();
                fd.append("file", file);
                fd.append("token", token);

                try {

                    const res =
                        await fetch("/api/aanvraag/upload",{
                            method:"POST",
                            body:fd
                        });

                    const data = await res.json();

                    if(res.ok && data.success){
                        setBijlagen((b)=>[...b,{ url:data.url, name:data.name }]);
                    } else {
                        setFout(data.error || "Upload mislukt.");
                    }

                } catch {
                    setFout("Upload mislukt.");
                }

            }

            setUploadBezig(false);

        },[token]);



    function verwijderBijlage(index:number){
        setBijlagen((b)=>b.filter((_,i)=>i !== index));
    }



    async function verstuur(){

        setFout("");

        if(!isEvalue8 && !typeAanvraag){
            setFout("Kies een type aanvraag (Installatie, Storing of Uren).");
            return;
        }

        if(!locatie.trim()){
            setFout("Vul de locatie / filiaalnaam in.");
            return;
        }
        if(!straat.trim()){
            setFout("Vul de straat in.");
            return;
        }
        if(!huisnummer.trim()){
            setFout("Vul het huisnummer in.");
            return;
        }
        if(!postcode.trim()){
            setFout("Vul de postcode in.");
            return;
        }
        if(!plaats.trim()){
            setFout("Vul de plaats in.");
            return;
        }
        if(!contactPersoon.trim()){
            setFout("Vul de contactpersoon in.");
            return;
        }
        if(!contactEmail.trim() && !contactPhone.trim()){
            setFout("Vul minimaal een e-mailadres of telefoonnummer in.");
            return;
        }

        const evalue8Keuzes =
            isEvalue8
            ? evalue8KeuzesVanState(evalue8Selectie)
            : [];

        if(isEvalue8 && evalue8Keuzes.length === 0){
            setFout("Selecteer minimaal één product.");
            return;
        }

        if(
            !isEvalue8
            && typeAanvraag === "installatie"
            && specs.schermen?.aan
            && schermenItems.length > 0
        ){
            const incompleet = schermenItems.findIndex(
                (s)=>!schermVeldenCompleet(s)
            );
            if(incompleet >= 0){
                setFout(
                    `Scherm ${incompleet + 1}: vul formaat, bevestiging, oriëntatie, locatie, stroom en internet in.`
                );
                return;
            }
        }

        if(
            !isEvalue8
            && typeAanvraag === "installatie"
            && specs.kiosk?.aan
            && kioskItems.length > 0
        ){
            const incompleet = kioskItems.findIndex(
                (k)=>!kioskVeldenCompleet(k)
            );
            if(incompleet >= 0){
                setFout(
                    `Kiosk ${incompleet + 1}: vul locatie, stroom en internet in.`
                );
                return;
            }
        }

        setVersturenBezig(true);

        // Korte samenvatting van de aangevinkte schermen (voor de lijstweergave).
        const schermenSamenvatting =
            isEvalue8
            ? evalue8Keuzes
                .map((k)=>
                    `${k.code}${k.aantal && k.aantal !== "1" ? ` ×${k.aantal}` : ""}`
                )
                .join(", ")
            : specs.schermen?.aan
            ? (
                schermenItems.length > 0
                ? samenvattingSchermen(schermenItems)
                : [
                    specs.schermen.velden.aantal,
                    parseGekozenOpties(specs.schermen.velden.formaat || "").join(" + ")
                        || specs.schermen.velden.formaat
                  ]
                    .filter(Boolean).join(" x ")
              )
            : "";

        const perSchermSi =
            !isEvalue8
            && specs.schermen?.aan
            && schermenItems.length > 0
            ? samenvattingStroomInternet(schermenItems)
            : null;

        try {

            // Stroom/internet-samenvatting uit per-onderdeel antwoorden (schermen).
            const stroomTekst = perSchermSi?.stroom || "";
            const internetTekst = perSchermSi?.internet || "";

            const schermenMetType =
                schermenItems.map((s)=>({
                    ...s,
                    berekendType:berekendInstallatieType(s, schermenItems)
                }));

            const res =
                await fetch(`/api/aanvraag/${token}`,{
                    method:"POST",
                    headers:{ "Content-Type":"application/json" },
                    body:JSON.stringify({
                        locatie, straat, huisnummer, postcode, plaats,
                        schermen:schermenSamenvatting,
                        stroom:stroomTekst,
                        internet:internetTekst,
                        opmerkingen,
                        aanvragerNaam,
                        specificaties:{
                            ...(isEvalue8 ? {} : {
                                ...specs,
                                schermen:{
                                    ...specs.schermen,
                                    velden:{
                                        ...specs.schermen.velden,
                                        aantal:specs.schermen.velden.aantal || String(schermenItems.length || "")
                                    },
                                    items:schermenMetType
                                },
                                kiosk:{
                                    ...specs.kiosk,
                                    velden:{
                                        ...specs.kiosk.velden,
                                        aantal:specs.kiosk.velden.aantal || String(kioskItems.length || "")
                                    },
                                    items:kioskItems
                                },
                                project,
                                projectOmschrijving:
                                    project === "Ja" ? projectOmschrijving : "",
                                storing:{
                                    omschrijving:storingOmschrijving,
                                    hardwareVervangen,
                                    hardwareBesteld,
                                    hardwareLevering
                                },
                                geschatUren,
                                aantalMonteurs,
                            }),
                            typeAanvraag: isEvalue8 ? "evalue8" : typeAanvraag,
                            evalue8Producten: isEvalue8 ? evalue8Keuzes : undefined,
                            contact:{
                                persoon:contactPersoon,
                                email:contactEmail,
                                telefoon:contactPhone
                            }
                        },
                        bijlagen
                    })
                });

            if(res.ok){
                setVerstuurd(true);
            } else {
                const data = await res.json();
                setFout(data.error || "Versturen mislukt.");
            }

        } catch {
            setFout("Versturen mislukt.");
        }

        setVersturenBezig(false);

    }



    if(laden){
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Laden...
            </div>
        );
    }


    if(!linkGeldig){
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <h1 className="text-xl font-bold text-gray-800 mb-2">
                        Ongeldige of verlopen link
                    </h1>
                    <p className="text-gray-600">
                        Deze aanvraaglink is niet (meer) geldig. Neem contact op met MDB Networks
                        voor een nieuwe link.
                    </p>
                </div>
            </div>
        );
    }


    if(verstuurd){
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <div className="text-5xl mb-4">✓</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Bedankt voor uw aanvraag!
                    </h1>
                    <p className="text-gray-600">
                        Uw aanvraag is ontvangen door MDB Networks. Wij nemen deze in behandeling
                        en nemen contact met u op voor de planning.
                    </p>
                </div>
            </div>
        );
    }


    return (

        <div className="min-h-screen bg-gray-50 py-8 px-4">

            <div className="max-w-2xl mx-auto">

                <div className="mb-6 text-center">
                    <img
                        src="/images/MDB-Logo.png"
                        alt="MDB Networks"
                        className="h-24 w-auto mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold text-gray-900">
                        Aanvraag Service- en Installatiewerkzaamheden
                    </h1>
                </div>


                <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">


                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                        <span className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
                            Opdrachtgever
                        </span>
                        <p className="text-lg font-bold text-sky-900">
                            {opdrachtgever}
                        </p>
                    </div>


                    {/* Locatie & adres */}
                    <div className="space-y-4">

                        <h2 className="font-semibold text-gray-800 border-b pb-1">
                            Gegevens locatie &amp; contactpersoon
                        </h2>

                        <label className="block">
                            <span className="text-sm text-gray-600">
                                Locatie / filiaalnaam{" "}
                                <span className="text-red-500">*</span>
                            </span>
                            <input
                                value={locatie}
                                onChange={(e)=>setLocatie(e.target.value)}
                                placeholder="Bijv. Filiaal Almere Centrum"
                                className="w-full border rounded-xl p-3 mt-1"
                                required
                            />
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <label className="block flex-1 min-w-[180px]">
                                <span className="text-sm text-gray-600">
                                    Straat{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <input
                                    value={straat}
                                    onChange={(e)=>setStraat(e.target.value)}
                                    className="w-full border rounded-xl p-3 mt-1"
                                    required
                                />
                            </label>
                            <label className="block w-28">
                                <span className="text-sm text-gray-600">
                                    Huisnr.{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <input
                                    value={huisnummer}
                                    onChange={(e)=>setHuisnummer(e.target.value)}
                                    className="w-full border rounded-xl p-3 mt-1"
                                    required
                                />
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <label className="block w-36">
                                <span className="text-sm text-gray-600">
                                    Postcode{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <input
                                    value={postcode}
                                    onChange={(e)=>setPostcode(e.target.value)}
                                    className="w-full border rounded-xl p-3 mt-1"
                                    required
                                />
                            </label>
                            <label className="block flex-1 min-w-[180px]">
                                <span className="text-sm text-gray-600">
                                    Plaats{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <input
                                    value={plaats}
                                    onChange={(e)=>setPlaats(e.target.value)}
                                    className="w-full border rounded-xl p-3 mt-1"
                                    required
                                />
                            </label>
                        </div>

                        <label className="block">
                            <span className="text-sm text-gray-600">
                                Contactpersoon{" "}
                                <span className="text-red-500">*</span>
                            </span>
                            <input
                                value={contactPersoon}
                                onChange={(e)=>setContactPersoon(e.target.value)}
                                placeholder="Naam contactpersoon"
                                className="w-full border rounded-xl p-3 mt-1"
                                required
                            />
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <label className="block flex-1 min-w-[180px]">
                                <span className="text-sm text-gray-600">
                                    E-mailadres{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e)=>setContactEmail(e.target.value)}
                                    placeholder="naam@bedrijf.nl"
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                            <label className="block flex-1 min-w-[150px]">
                                <span className="text-sm text-gray-600">
                                    Telefoonnummer{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                                <input
                                    value={contactPhone}
                                    onChange={(e)=>setContactPhone(e.target.value)}
                                    placeholder="06 ..."
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 -mt-2">
                            Vul minimaal e-mail of telefoon in.
                        </p>

                    </div>


                    {/* Type aanvraag — niet voor eValue8 */}
                    {!isEvalue8 ? (
                    <div className="space-y-2">
                        <h2 className="font-semibold text-gray-800 border-b pb-1">
                            Type aanvraag
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { k:"installatie", label:"Installatiewerkzaamheden" },
                                { k:"storing", label:"Storing" },
                                { k:"uren", label:"Uren" }
                            ].map((t)=>(
                                <button
                                    key={t.k}
                                    type="button"
                                    onClick={()=>setTypeAanvraag(t.k)}
                                    className={
                                        "flex-1 min-w-[140px] rounded-xl py-3 px-3 border-2 text-sm font-medium "
                                        +
                                        (typeAanvraag === t.k
                                            ? "bg-sky-100 text-sky-800 border-sky-300"
                                            : "bg-white text-gray-700 border-gray-200")
                                    }
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    ) : null}


                    {/* ===== eValue8 productoverzicht ===== */}
                    {isEvalue8 ? (
                    <>
                    <Evalue8ProductSpecificatie
                        selectie={evalue8Selectie}
                        onChange={setEvalue8Selectie}
                    />

                    <label className="block">
                        <span className="text-sm text-gray-600">Opmerkingen</span>
                        <textarea
                            rows={3}
                            value={opmerkingen}
                            onChange={(e)=>setOpmerkingen(e.target.value)}
                            placeholder="Aanvullende instructies of details"
                            className="w-full border rounded-xl p-3 mt-1"
                        />
                    </label>
                    </>
                    ) : null}


                    {/* ===== Installatiewerkzaamheden ===== */}
                    {!isEvalue8 && typeAanvraag === "installatie" && (
                    <>
                    {/* Specificatie installatie werkzaamheden */}
                    <div className="space-y-3">

                        <h2 className="font-semibold text-gray-800 border-b pb-1">
                            Specificatie installatie werkzaamheden
                        </h2>

                        {ONDERDELEN.map((o)=>{

                            const blok = specs[o.key];

                            return (

                                <div
                                    key={o.key}
                                    className={`rounded-xl border ${o.kleur}`}
                                >

                                    <button
                                        type="button"
                                        onClick={()=>toggleBlok(o.key)}
                                        className="w-full flex items-center justify-between p-3 text-left"
                                    >
                                        <span className="font-medium text-gray-800">
                                            {o.titel}
                                        </span>
                                        <span className="text-xl text-gray-500 leading-none">
                                            {blok.aan ? "−" : "+"}
                                        </span>
                                    </button>

                                    {
                                        blok.aan && (
                                            <div className="px-3 pb-3 space-y-2">
                                                {o.key === "schermen" ? (
                                                    <SchermenSpecificatie
                                                        aantal={blok.velden.aantal || ""}
                                                        onAantalChange={(a)=>{
                                                            zetVeld("schermen", "aantal", a);
                                                            const n = parseInt(a, 10);
                                                            if(!Number.isFinite(n) || n < 0){
                                                                setSchermenItems([]);
                                                                return;
                                                            }
                                                            setSchermenItems((prev)=>
                                                                syncSchermItems(prev, n)
                                                            );
                                                        }}
                                                        items={schermenItems}
                                                        onItemsChange={setSchermenItems}
                                                    />
                                                ) : o.key === "videowall" ? (
                                                    <VideowallSpecificatie
                                                        velden={blok.velden}
                                                        onChange={(veld, waarde)=>
                                                            zetVeld("videowall", veld, waarde)
                                                        }
                                                        onPatch={(patch)=>
                                                            zetVelden("videowall", patch)
                                                        }
                                                        onToggleFormaat={(optie)=>
                                                            toggleMeerdereOptie("videowall", "formaat", optie)
                                                        }
                                                    />
                                                ) : o.key === "kiosk" ? (
                                                    <KioskSpecificatie
                                                        aantal={blok.velden.aantal || ""}
                                                        onAantalChange={(a)=>{
                                                            zetVeld("kiosk", "aantal", a);
                                                            const n = parseInt(a, 10);
                                                            if(!Number.isFinite(n) || n < 0){
                                                                setKioskItems([]);
                                                                return;
                                                            }
                                                            setKioskItems((prev)=>
                                                                syncKioskItems(prev, n)
                                                            );
                                                        }}
                                                        items={kioskItems}
                                                        onItemsChange={setKioskItems}
                                                    />
                                                ) : o.key === "audio" ? (
                                                    <AudioSpecificatie
                                                        velden={blok.velden}
                                                        onChange={(veld, waarde)=>
                                                            zetVeld("audio", veld, waarde)
                                                        }
                                                        onPatch={(patch)=>
                                                            zetVelden("audio", patch)
                                                        }
                                                    />
                                                ) : (
                                                    <>
                                                        {o.velden.map((v)=>(
                                                            <label key={v.key} className="block">
                                                                <span className="text-xs text-gray-600">{v.label}</span>
                                                                {
                                                                    v.beugels
                                                                    ? (
                                                                        <div className="mt-1 space-y-1.5">
                                                                            {v.beugels.map((bt)=>(
                                                                                <div key={bt} className="flex items-center gap-2">
                                                                                    <span className="text-sm text-gray-700 flex-1">{bt}</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        value={blok.velden[`beugel_${bt}`] || ""}
                                                                                        onChange={(e)=>zetVeld(o.key, `beugel_${bt}`, e.target.value)}
                                                                                        placeholder="0"
                                                                                        className="w-20 border rounded-lg p-2 bg-white text-center"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )
                                                                    : v.opties && v.meerdere
                                                                    ? (
                                                                        <div className="mt-1 space-y-2">
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {v.opties.map((optie)=>{
                                                                                    const pastel = FORMAAT_PASTEL[optie];
                                                                                    const selected = parseGekozenOpties(blok.velden[v.key] || "").includes(optie);
                                                                                    return (
                                                                                    <button
                                                                                        key={optie}
                                                                                        type="button"
                                                                                        onClick={()=>toggleMeerdereOptie(o.key, v.key, optie)}
                                                                                        className={
                                                                                            "rounded-lg px-3 py-2 border-2 text-sm font-medium "
                                                                                            +
                                                                                            (selected && pastel
                                                                                                ? `${pastel.bg} ${pastel.border} ${pastel.text}`
                                                                                                : selected
                                                                                                ? "bg-sky-100 text-sky-900 border-sky-300"
                                                                                                : "bg-white text-gray-700 border-gray-200")
                                                                                        }
                                                                                    >
                                                                                        {optie}
                                                                                    </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                            {
                                                                                parseGekozenOpties(blok.velden[v.key] || "").includes("Anders") && (
                                                                                    <input
                                                                                        value={blok.velden.formaatAnders || ""}
                                                                                        onChange={(e)=>zetVeld(o.key, "formaatAnders", e.target.value)}
                                                                                        placeholder="Anders formaat (inch)"
                                                                                        className="w-full border rounded-lg p-2 bg-white"
                                                                                    />
                                                                                )
                                                                            }
                                                                        </div>
                                                                    )
                                                                    : v.opties
                                                                    ? (
                                                                        <select
                                                                            value={blok.velden[v.key] || ""}
                                                                            onChange={(e)=>zetVeld(o.key, v.key, e.target.value)}
                                                                            className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                                                                        >
                                                                            <option value="">Kies...</option>
                                                                            {v.opties.map((optie)=>(
                                                                                <option key={optie} value={optie}>{optie}</option>
                                                                            ))}
                                                                        </select>
                                                                    )
                                                                    : (
                                                                        <input
                                                                            value={blok.velden[v.key] || ""}
                                                                            onChange={(e)=>zetVeld(o.key, v.key, e.target.value)}
                                                                            placeholder={v.plh || ""}
                                                                            className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                                                                        />
                                                                    )
                                                                }
                                                            </label>
                                                        ))}
                                                        {o.key === "mediaplayers" ? (
                                                            <StroomInternetVragen
                                                                velden={blok.velden}
                                                                onChange={(veldOrPatch, waarde)=>{
                                                                    if(typeof veldOrPatch === "string"){
                                                                        zetVeld(o.key, veldOrPatch, waarde || "");
                                                                    } else {
                                                                        zetVelden(o.key, veldOrPatch);
                                                                    }
                                                                }}
                                                            />
                                                        ) : null}
                                                    </>
                                                )}
                                            </div>
                                        )
                                    }

                                </div>

                            );

                        })}


                        {/* Project ja/nee — alleen Ja of niets */}
                        <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 space-y-3">
                            <span className="text-sm font-medium text-gray-800 block">
                                6. Project (offerte-basis) — is het een project?
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={()=>{
                                        setProject((h)=>{
                                            if(h === "Ja"){
                                                setProjectOmschrijving("");
                                                return "";
                                            }
                                            return "Ja";
                                        });
                                    }}
                                    className={
                                        "flex-1 rounded-lg py-2 border-2 text-sm font-medium bg-white "
                                        +
                                        (project === "Ja"
                                            ? "border-emerald-300 text-emerald-700"
                                            : "border-gray-200 text-gray-700")
                                    }
                                >
                                    Ja
                                </button>
                            </div>
                            {project === "Ja" ? (
                                <label className="block">
                                    <span className="text-xs text-gray-600">
                                        Omschrijf het project
                                    </span>
                                    <textarea
                                        rows={3}
                                        value={projectOmschrijving}
                                        onChange={(e)=>
                                            setProjectOmschrijving(e.target.value)
                                        }
                                        placeholder="Korte omschrijving van het project"
                                        className="w-full border rounded-lg p-2 mt-0.5 bg-white"
                                    />
                                </label>
                            ) : null}
                        </div>

                    </div>


                    {/* Opmerkingen */}
                    <label className="block">
                        <span className="text-sm text-gray-600">Opmerkingen</span>
                        <textarea
                            rows={3}
                            value={opmerkingen}
                            onChange={(e)=>setOpmerkingen(e.target.value)}
                            placeholder="Aanvullende instructies of details"
                            className="w-full border rounded-xl p-3 mt-1"
                        />
                    </label>


                    </>
                    )}


                    {/* ===== Storing ===== */}
                    {!isEvalue8 && typeAanvraag === "storing" && (
                        <div className="space-y-4">

                            <label className="block">
                                <span className="text-sm text-gray-600">Omschrijving storing</span>
                                <textarea
                                    rows={4}
                                    value={storingOmschrijving}
                                    onChange={(e)=>setStoringOmschrijving(e.target.value)}
                                    placeholder="Beschrijf de storing zo duidelijk mogelijk"
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>

                            <div>
                                <span className="text-sm text-gray-600 block mb-1">
                                    Moet er hardware worden vervangen?
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={()=>setHardwareVervangen((h)=>h === "Ja" ? "" : "Ja")}
                                        className={
                                            "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                            +
                                            (hardwareVervangen === "Ja"
                                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                                : "bg-white text-gray-700 border-gray-200")
                                        }
                                    >
                                        Ja
                                    </button>
                                    <button
                                        type="button"
                                        onClick={()=>setHardwareVervangen((h)=>h === "Nee" ? "" : "Nee")}
                                        className={
                                            "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                            +
                                            (hardwareVervangen === "Nee"
                                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                : "bg-white text-gray-700 border-gray-200")
                                        }
                                    >
                                        Nee
                                    </button>
                                </div>
                            </div>

                            {
                                hardwareVervangen === "Ja" && (
                                    <div className="pl-3 border-l-2 border-amber-200 space-y-3">

                                        <div>
                                            <span className="text-sm text-gray-600 block mb-1">
                                                Is deze al besteld?
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={()=>setHardwareBesteld((h)=>h === "Ja" ? "" : "Ja")}
                                                    className={
                                                        "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                                        +
                                                        (hardwareBesteld === "Ja"
                                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                            : "bg-white text-gray-700 border-gray-200")
                                                    }
                                                >
                                                    Ja
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={()=>setHardwareBesteld((h)=>h === "Nee" ? "" : "Nee")}
                                                    className={
                                                        "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                                        +
                                                        (hardwareBesteld === "Nee"
                                                            ? "bg-amber-100 text-amber-800 border-amber-300"
                                                            : "bg-white text-gray-700 border-gray-200")
                                                    }
                                                >
                                                    Nee
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-sm text-gray-600 block mb-1">
                                                Waar wordt deze geleverd?
                                            </span>
                                            <div className="flex gap-2">
                                                {["MDB Networks","Op locatie"].map((optie)=>(
                                                    <button
                                                        key={optie}
                                                        type="button"
                                                        onClick={()=>setHardwareLevering((h)=>h === optie ? "" : optie)}
                                                        className={
                                                            "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                                            +
                                                            (hardwareLevering === optie
                                                                ? "bg-sky-100 text-sky-800 border-sky-300"
                                                                : "bg-white text-gray-700 border-gray-200")
                                                        }
                                                    >
                                                        {optie}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                )
                            }

                            <label className="block">
                                <span className="text-sm text-gray-600">Opmerkingen</span>
                                <textarea
                                    rows={3}
                                    value={opmerkingen}
                                    onChange={(e)=>setOpmerkingen(e.target.value)}
                                    placeholder="Aanvullende instructies of details"
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>

                        </div>
                    )}


                    {/* ===== Uren ===== */}
                    { !isEvalue8 && typeAanvraag === "uren" && (
                        <div className="space-y-4">

                            <div className="flex flex-wrap gap-3">
                                <label className="block flex-1 min-w-[140px]">
                                    <span className="text-sm text-gray-600">Geschat aantal dagen</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={geschatUren}
                                        onChange={(e)=>setGeschatUren(e.target.value)}
                                        placeholder="Bijv. 2"
                                        className="w-full border rounded-xl p-3 mt-1"
                                    />
                                </label>

                                <label className="block flex-1 min-w-[140px]">
                                    <span className="text-sm text-gray-600">Aantal monteurs</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={aantalMonteurs}
                                        onChange={(e)=>setAantalMonteurs(e.target.value)}
                                        placeholder="Bijv. 2"
                                        className="w-full border rounded-xl p-3 mt-1"
                                    />
                                </label>
                            </div>

                            <label className="block">
                                <span className="text-sm text-gray-600">Opmerkingen</span>
                                <textarea
                                    rows={3}
                                    value={opmerkingen}
                                    onChange={(e)=>setOpmerkingen(e.target.value)}
                                    placeholder="Aanvullende instructies of details"
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>

                        </div>
                    )}


                    {/* Bijlagen */}
                    <div className="space-y-3">

                        <h2 className="font-semibold text-gray-800 border-b pb-1">
                            Documenten / bijlagen
                        </h2>

                        <div
                            onDragOver={(e)=>{ e.preventDefault(); setSleepActief(true); }}
                            onDragLeave={()=>setSleepActief(false)}
                            onDrop={(e)=>{
                                e.preventDefault();
                                setSleepActief(false);
                                if(e.dataTransfer.files?.length){
                                    verwerkBestanden(e.dataTransfer.files);
                                }
                            }}
                            className={
                                "border-2 border-dashed rounded-xl p-6 text-center transition "
                                +
                                (sleepActief ? "border-sky-500 bg-sky-50" : "border-gray-300")
                            }
                        >
                            <p className="text-gray-500 text-sm mb-2">
                                Sleep foto&apos;s of PDF&apos;s hierheen, of
                            </p>
                            <label className="inline-block cursor-pointer text-sky-600 font-medium">
                                <span>kies bestanden</span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={(e)=>{
                                        if(e.target.files?.length){
                                            verwerkBestanden(e.target.files);
                                        }
                                    }}
                                />
                            </label>
                            {
                                uploadBezig && (
                                    <p className="text-xs text-gray-400 mt-2">Bezig met uploaden...</p>
                                )
                            }
                        </div>

                        {
                            bijlagen.length > 0 && (
                                <ul className="space-y-1">
                                    {bijlagen.map((b,i)=>(
                                        <li
                                            key={i}
                                            className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                                        >
                                            <span className="truncate">📎 {b.name}</span>
                                            <button
                                                type="button"
                                                onClick={()=>verwijderBijlage(i)}
                                                className="text-red-500 ml-2"
                                            >
                                                Verwijderen
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )
                        }

                    </div>


                    {/* Naam aanvrager + opdrachtgever */}
                    <div className="space-y-1">
                        <label className="block">
                            <span className="text-sm text-gray-600">Naam:</span>
                            <input
                                value={aanvragerNaam}
                                onChange={(e)=>setAanvragerNaam(e.target.value)}
                                placeholder="Uw naam"
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>
                        <p className="text-xs text-gray-400">
                            Opdrachtgever: {opdrachtgever}
                        </p>
                    </div>


                    {
                        fout && (
                            <p className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-3 text-sm">
                                {fout}
                            </p>
                        )
                    }


                    <button
                        type="button"
                        onClick={verstuur}
                        disabled={versturenBezig || uploadBezig}
                        className="
                            w-full
                            bg-sky-600
                            text-white
                            rounded-xl
                            py-3
                            font-bold
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                        "
                    >
                        {versturenBezig ? "Bezig met versturen..." : "Verstuur aanvraag"}
                    </button>

                </div>

            </div>

        </div>

    );

}



export default function AanvraagPage(){

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Laden...
            </div>
        }>
            <AanvraagFormulier />
        </Suspense>
    );

}
