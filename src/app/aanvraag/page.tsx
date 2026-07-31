"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";



interface Bijlage {
    url:string;
    name:string;
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


    // Formuliervelden
    const [locatie,setLocatie] = useState("");
    const [straat,setStraat] = useState("");
    const [huisnummer,setHuisnummer] = useState("");
    const [postcode,setPostcode] = useState("");
    const [plaats,setPlaats] = useState("");
    const [schermen,setSchermen] = useState("");
    const [beugel,setBeugel] = useState("");
    const [stroom,setStroom] = useState("");
    const [internet,setInternet] = useState("");
    const [opmerkingen,setOpmerkingen] = useState("");

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

        if(!straat && !locatie && !plaats){
            setFout("Vul minimaal een locatie of adres in.");
            return;
        }

        setVersturenBezig(true);

        try {

            const res =
                await fetch(`/api/aanvraag/${token}`,{
                    method:"POST",
                    headers:{ "Content-Type":"application/json" },
                    body:JSON.stringify({
                        locatie, straat, huisnummer, postcode, plaats,
                        schermen, beugel, stroom, internet, opmerkingen,
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
                    <h1 className="text-2xl font-bold text-gray-900">
                        Opdrachtaanvraag
                    </h1>
                    <p className="text-gray-600 mt-1">
                        MDB Networks
                    </p>
                </div>


                <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">


                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                            Opdrachtgever
                        </span>
                        <p className="text-lg font-bold text-blue-900">
                            {opdrachtgever}
                        </p>
                    </div>


                    {/* Locatie & adres */}
                    <div className="space-y-4">

                        <h2 className="font-semibold text-gray-800 border-b pb-1">
                            Locatie &amp; adresgegevens
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

                    </div>


                    {/* Specificaties */}
                    <div className="space-y-4">

                        <h2 className="font-semibold text-gray-800 border-b pb-1">
                            Specificaties van de installatie
                        </h2>

                        <label className="block">
                            <span className="text-sm text-gray-600">Type / welke schermen?</span>
                            <input
                                value={schermen}
                                onChange={(e)=>setSchermen(e.target.value)}
                                placeholder="Bijv. 2x 55 inch, staand"
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm text-gray-600">Type / welke beugel?</span>
                            <input
                                value={beugel}
                                onChange={(e)=>setBeugel(e.target.value)}
                                placeholder="Bijv. muurbeugel, plafondbeugel"
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>

                        <div>
                            <span className="text-sm text-gray-600 block mb-1">
                                Stroom aanwezig binnen 3 meter?
                            </span>
                            <div className="flex gap-2">
                                {["Ja","Nee","N.v.t."].map((optie)=>(
                                    <button
                                        key={optie}
                                        type="button"
                                        onClick={()=>setStroom(optie)}
                                        className={
                                            "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                            +
                                            (stroom === optie
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-gray-700 border-gray-200")
                                        }
                                    >
                                        {optie}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span className="text-sm text-gray-600 block mb-1">
                                Internet aanwezig binnen 3 meter?
                            </span>
                            <div className="flex gap-2">
                                {["Ja","Nee","N.v.t."].map((optie)=>(
                                    <button
                                        key={optie}
                                        type="button"
                                        onClick={()=>setInternet(optie)}
                                        className={
                                            "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                            +
                                            (internet === optie
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-gray-700 border-gray-200")
                                        }
                                    >
                                        {optie}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>


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
                                (sleepActief ? "border-blue-500 bg-blue-50" : "border-gray-300")
                            }
                        >
                            <p className="text-gray-500 text-sm mb-2">
                                Sleep foto&apos;s of PDF&apos;s hierheen, of
                            </p>
                            <label className="inline-block cursor-pointer text-blue-600 font-medium">
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
                            bg-blue-600
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
