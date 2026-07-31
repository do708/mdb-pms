"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";



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
    velden:{ key:string; label:string; plh?:string; opties?:string[]; beugels?:string[] }[];
}[] = [
    {
        key:"schermen",
        titel:"1. Schermen",
        kleur:"bg-sky-50 border-sky-200",
        velden:[
            { key:"aantal", label:"Aantal schermen", plh:"Bijv. 2" },
            { key:"formaat", label:"Formaat / inch", plh:"Bijv. 55 inch" },
            {
                key:"beugels",
                label:"Welke beugels? (vul het aantal in)",
                beugels:[
                    "Muurbeugel",
                    "Zwenkbeugel",
                    "Plafondbeugel 150cm",
                    "Plafondbeugel 300cm",
                    "Vloerstandaard",
                    "Overig"
                ]
            },
            { key:"orientatie", label:"Oriëntatie", opties:["Landscape","Portrait","Landscape en Portrait"] },
            { key:"opmerking", label:"Opmerking", plh:"Aanvullende details" }
        ]
    },
    {
        key:"videowall",
        titel:"2. Videowall",
        kleur:"bg-emerald-50 border-emerald-200",
        velden:[
            { key:"configuratie", label:"Configuratie", plh:"Bijv. 2x2, 3x3" },
            { key:"formaat", label:"Formaat / inch", plh:"Bijv. 46 inch" },
            { key:"orientatie", label:"Oriëntatie", opties:["Landscape","Portrait"] },
            { key:"opmerking", label:"Opmerking", plh:"Aanvullende details" }
        ]
    },
    {
        key:"kiosk",
        titel:"3. Kiosk",
        kleur:"bg-amber-50 border-amber-200",
        velden:[
            { key:"aantal", label:"Aantal", plh:"Bijv. 1" },
            { key:"type", label:"Type kiosk", plh:"Bijv. Easy, Full, Extended" },
            { key:"opmerking", label:"Opmerking", plh:"Aanvullende details" }
        ]
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
        velden:[
            { key:"speakers", label:"Speakers", plh:"Aantal / type" },
            { key:"versterker", label:"Versterker", plh:"Bijv. 1x versterker" },
            { key:"opmerking", label:"Opmerking", plh:"Aanvullende details" }
        ]
    }
];



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

    const [project,setProject] = useState("");
    const [stroom,setStroom] = useState("");
    const [stroomRealisatie,setStroomRealisatie] = useState("");
    const [stroomRealisatieAnders,setStroomRealisatieAnders] = useState("");

    const [internet,setInternet] = useState("");
    const [internetRealisatie,setInternetRealisatie] = useState("");
    const [internetRealisatieAnders,setInternetRealisatieAnders] = useState("");
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

        if(!typeAanvraag){
            setFout("Kies een type aanvraag (Installatie, Storing of Uren).");
            return;
        }

        if(!locatie && !straat && !plaats){
            setFout("Vul minimaal de locatie of het adres van de werklocatie in.");
            return;
        }

        setVersturenBezig(true);

        // Korte samenvatting van de aangevinkte schermen (voor de lijstweergave).
        const schermenSamenvatting =
            specs.schermen?.aan
            ? [specs.schermen.velden.aantal, specs.schermen.velden.formaat]
                .filter(Boolean).join(" x ")
            : "";

        try {

            // Stroom/internet met eventuele "MDB realiseert?"-vervolgvraag
            // samenvatten tot één leesbare tekst.
            const stroomTekst =
                stroom === "Nee"
                ? `Nee — MDB realiseren? ${stroomRealisatie === "Anders" ? `Anders: ${stroomRealisatieAnders}` : (stroomRealisatie || "-")}`
                : stroom;

            const internetTekst =
                internet === "Nee"
                ? `Nee — MDB realiseren? ${internetRealisatie === "Anders" ? `Anders: ${internetRealisatieAnders}` : (internetRealisatie || "-")}`
                : internet;

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
                            ...specs,
                            project,
                            typeAanvraag,
                            storing:{
                                omschrijving:storingOmschrijving,
                                hardwareVervangen,
                                hardwareBesteld,
                                hardwareLevering
                            },
                            geschatUren,
                            aantalMonteurs,
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
                            <span className="text-sm text-gray-600">Locatie / filiaalnaam</span>
                            <input
                                value={locatie}
                                onChange={(e)=>setLocatie(e.target.value)}
                                placeholder="Bijv. Filiaal Almere Centrum"
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <label className="block flex-1 min-w-[180px]">
                                <span className="text-sm text-gray-600">Straat</span>
                                <input
                                    value={straat}
                                    onChange={(e)=>setStraat(e.target.value)}
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                            <label className="block w-28">
                                <span className="text-sm text-gray-600">Huisnr.</span>
                                <input
                                    value={huisnummer}
                                    onChange={(e)=>setHuisnummer(e.target.value)}
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <label className="block w-36">
                                <span className="text-sm text-gray-600">Postcode</span>
                                <input
                                    value={postcode}
                                    onChange={(e)=>setPostcode(e.target.value)}
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                            <label className="block flex-1 min-w-[180px]">
                                <span className="text-sm text-gray-600">Plaats</span>
                                <input
                                    value={plaats}
                                    onChange={(e)=>setPlaats(e.target.value)}
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                        </div>

                        <label className="block">
                            <span className="text-sm text-gray-600">Contactpersoon:</span>
                            <input
                                value={contactPersoon}
                                onChange={(e)=>setContactPersoon(e.target.value)}
                                placeholder="Naam contactpersoon"
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <label className="block flex-1 min-w-[180px]">
                                <span className="text-sm text-gray-600">E-mailadres</span>
                                <input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e)=>setContactEmail(e.target.value)}
                                    placeholder="naam@bedrijf.nl"
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                            <label className="block flex-1 min-w-[150px]">
                                <span className="text-sm text-gray-600">Telefoonnummer</span>
                                <input
                                    value={contactPhone}
                                    onChange={(e)=>setContactPhone(e.target.value)}
                                    placeholder="06 ..."
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                        </div>

                    </div>


                    {/* Type aanvraag */}
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


                    {/* ===== Installatiewerkzaamheden ===== */}
                    {typeAanvraag === "installatie" && (
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
                                            </div>
                                        )
                                    }

                                </div>

                            );

                        })}


                        {/* Project ja/nee */}
                        <div className="rounded-xl border border-gray-200 p-3">
                            <span className="text-sm font-medium text-gray-800 block mb-2">
                                6. Project (offerte-basis) — is het een project?
                            </span>
                            <div className="flex gap-2">
                                {["Ja","Nee"].map((optie)=>(
                                    <button
                                        key={optie}
                                        type="button"
                                        onClick={()=>setProject((h)=>h === optie ? "" : optie)}
                                        className={
                                            "flex-1 rounded-lg py-2 border-2 text-sm font-medium "
                                            +
                                            (project === optie
                                                ? "bg-teal-100 text-teal-800 border-teal-300"
                                                : "bg-white text-gray-700 border-gray-200")
                                        }
                                    >
                                        {optie}
                                    </button>
                                ))}
                            </div>
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


                    {/* Stroom & internet */}
                    <div className="space-y-4">

                        <div>
                            <span className="text-sm text-gray-600 block mb-1">
                                Stroom aanwezig binnen 3 meter?
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={()=>setStroom("Ja")}
                                    className={
                                        "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                        +
                                        (stroom === "Ja"
                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                            : "bg-white text-gray-700 border-gray-200")
                                    }
                                >
                                    Ja
                                </button>
                                <button
                                    type="button"
                                    onClick={()=>setStroom("Nee")}
                                    className={
                                        "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                        +
                                        (stroom === "Nee"
                                            ? "bg-amber-100 text-amber-800 border-amber-300"
                                            : "bg-white text-gray-700 border-gray-200")
                                    }
                                >
                                    Nee
                                </button>
                            </div>

                            {
                                stroom === "Nee" && (
                                    <div className="mt-3 pl-3 border-l-2 border-amber-200 space-y-2">
                                        <span className="text-sm text-gray-600 block">
                                            Wil je dat MDB Networks dit realiseert?
                                        </span>
                                        <div className="flex gap-2">
                                            {["Ja","Nee","Anders"].map((optie)=>(
                                                <button
                                                    key={optie}
                                                    type="button"
                                                    onClick={()=>setStroomRealisatie(optie)}
                                                    className={
                                                        "flex-1 rounded-lg py-2 border-2 text-sm font-medium "
                                                        +
                                                        (stroomRealisatie === optie
                                                            ? "bg-sky-100 text-sky-800 border-sky-300"
                                                            : "bg-white text-gray-700 border-gray-200")
                                                    }
                                                >
                                                    {optie}
                                                </button>
                                            ))}
                                        </div>
                                        {
                                            stroomRealisatie === "Anders" && (
                                                <textarea
                                                    rows={2}
                                                    value={stroomRealisatieAnders}
                                                    onChange={(e)=>setStroomRealisatieAnders(e.target.value)}
                                                    placeholder="Licht toe"
                                                    className="w-full border rounded-lg p-2 bg-white"
                                                />
                                            )
                                        }
                                    </div>
                                )
                            }
                        </div>


                        <div>
                            <span className="text-sm text-gray-600 block mb-1">
                                Internet aanwezig binnen 3 meter?
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={()=>setInternet("Ja")}
                                    className={
                                        "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                        +
                                        (internet === "Ja"
                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                            : "bg-white text-gray-700 border-gray-200")
                                    }
                                >
                                    Ja
                                </button>
                                <button
                                    type="button"
                                    onClick={()=>setInternet("Nee")}
                                    className={
                                        "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                        +
                                        (internet === "Nee"
                                            ? "bg-amber-100 text-amber-800 border-amber-300"
                                            : "bg-white text-gray-700 border-gray-200")
                                    }
                                >
                                    Nee
                                </button>
                            </div>

                            {
                                internet === "Nee" && (
                                    <div className="mt-3 pl-3 border-l-2 border-amber-200 space-y-2">
                                        <span className="text-sm text-gray-600 block">
                                            Wil je dat MDB Networks dit realiseert?
                                        </span>
                                        <div className="flex gap-2">
                                            {["Ja","Nee","Anders"].map((optie)=>(
                                                <button
                                                    key={optie}
                                                    type="button"
                                                    onClick={()=>setInternetRealisatie(optie)}
                                                    className={
                                                        "flex-1 rounded-lg py-2 border-2 text-sm font-medium "
                                                        +
                                                        (internetRealisatie === optie
                                                            ? "bg-sky-100 text-sky-800 border-sky-300"
                                                            : "bg-white text-gray-700 border-gray-200")
                                                    }
                                                >
                                                    {optie}
                                                </button>
                                            ))}
                                        </div>
                                        {
                                            internetRealisatie === "Anders" && (
                                                <textarea
                                                    rows={2}
                                                    value={internetRealisatieAnders}
                                                    onChange={(e)=>setInternetRealisatieAnders(e.target.value)}
                                                    placeholder="Licht toe"
                                                    className="w-full border rounded-lg p-2 bg-white"
                                                />
                                            )
                                        }
                                    </div>
                                )
                            }
                        </div>

                    </div>
                    </>
                    )}


                    {/* ===== Storing ===== */}
                    {typeAanvraag === "storing" && (
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
                    {typeAanvraag === "uren" && (
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
