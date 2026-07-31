"use client";

import { useEffect, useState, useRef } from "react";


interface Attachment {
    id:string;
    url:string;
    filename:string | null;
    originalName:string | null;
    contentType:string | null;
    createdAt:string;
}


interface Props {
    workorderId:string;
    readOnly?:boolean;
}


// Icoon op basis van bestandsnaam/type.
function icoonVoor(naam:string):string {

    const n = naam.toLowerCase();

    if(n.endsWith(".msg") || n.endsWith(".eml")){ return "✉️"; }
    if(n.endsWith(".pdf")){ return "📄"; }
    if(n.match(/\.(png|jpe?g|gif|webp|heic)$/)){ return "🖼️"; }
    if(n.match(/\.(docx?|odt)$/)){ return "📝"; }
    if(n.match(/\.(xlsx?|csv)$/)){ return "📊"; }
    if(n.match(/\.(zip|rar|7z)$/)){ return "🗜️"; }

    return "📎";

}


function datumNL(iso:string):string {
    try {
        return new Date(iso).toLocaleDateString("nl-NL",{
            day:"numeric",
            month:"short",
            year:"numeric",
            hour:"2-digit",
            minute:"2-digit"
        });
    } catch {
        return "";
    }
}


export default function CorrespondentieBlok({
    workorderId,
    readOnly = false
}:Props){


    const [items,setItems] =
        useState<Attachment[]>([]);

    const [laden,setLaden] =
        useState(true);

    const [bezig,setBezig] =
        useState(false);

    const [sleepActief,setSleepActief] =
        useState(false);

    const inputRef =
        useRef<HTMLInputElement | null>(null);



    async function laadItems(){
        try {
            const res =
                await fetch(`/api/workorders/${workorderId}/attachments`);
            if(res.ok){
                setItems(await res.json());
            }
        } finally {
            setLaden(false);
        }
    }


    useEffect(()=>{
        laadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[workorderId]);



    async function uploadBestanden(bestanden:FileList | File[]){

        const lijst =
            Array.from(bestanden);

        if(lijst.length === 0){ return; }

        setBezig(true);

        try {

            for(const file of lijst){

                const body =
                    new FormData();

                body.append("file", file);

                const res =
                    await fetch(
                        `/api/workorders/${workorderId}/attachments`,
                        {
                            method:"POST",
                            body
                        }
                    );

                if(!res.ok){
                    const data =
                        await res.json().catch(()=>null);
                    alert(
                        data?.error
                        ?
                        `Uploaden mislukt: ${data.error}`
                        :
                        "Uploaden mislukt"
                    );
                }

            }

            await laadItems();

        } finally {
            setBezig(false);
        }

    }


    async function verwijder(id:string){

        if(!confirm("Deze bijlage verwijderen?")){ return; }

        const res =
            await fetch(
                `/api/workorders/${workorderId}/attachments?attachmentId=${id}`,
                { method:"DELETE" }
            );

        if(res.ok){
            setItems(items.filter(i=>i.id !== id));
        } else {
            alert("Verwijderen mislukt");
        }

    }



    return (

        <section className="
            bg-white
            rounded-2xl
            border
            p-5
        ">

            <h2 className="font-bold mb-1">
                Correspondentie & bijlagen
            </h2>

            <p className="text-xs text-slate-500 mb-3">
                Sleep hier e-mails (.msg/.eml), PDF&apos;s, foto&apos;s of andere
                bestanden naartoe om ze bij deze werkbon te bewaren.
            </p>


            {
                !readOnly && (

                    <div

                        onDragOver={(e)=>{
                            e.preventDefault();
                            setSleepActief(true);
                        }}

                        onDragLeave={()=>setSleepActief(false)}

                        onDrop={(e)=>{
                            e.preventDefault();
                            setSleepActief(false);
                            if(e.dataTransfer.files?.length){
                                uploadBestanden(e.dataTransfer.files);
                            }
                        }}

                        onClick={()=>inputRef.current?.click()}

                        className={`
                            border-2
                            border-dashed
                            rounded-xl
                            p-6
                            text-center
                            cursor-pointer
                            transition
                            mb-4
                            ${sleepActief
                                ? "border-blue-400 bg-blue-50"
                                : "border-gray-300 hover:bg-gray-50"}
                        `}

                    >

                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e)=>{
                                if(e.target.files?.length){
                                    uploadBestanden(e.target.files);
                                }
                                e.target.value = "";
                            }}
                        />

                        <div className="text-3xl mb-1">📥</div>

                        <div className="text-sm text-gray-600">
                            {
                                bezig
                                ?
                                "Bezig met opslaan..."
                                :
                                "Sleep bestanden hierheen of klik om te kiezen"
                            }
                        </div>

                    </div>

                )
            }



            {
                laden
                ?
                (
                    <div className="text-sm text-gray-400">
                        Laden...
                    </div>
                )
                :
                items.length === 0
                ?
                (
                    <div className="text-sm text-gray-400">
                        Nog geen correspondentie bewaard.
                    </div>
                )
                :
                (
                    <ul className="space-y-2">

                        {
                            items.map(item=>{

                                const naam =
                                    item.originalName
                                    ?? item.filename
                                    ?? "bestand";

                                return (

                                    <li
                                        key={item.id}
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            gap-2
                                            border
                                            rounded-xl
                                            p-2.5
                                        "
                                    >

                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="
                                                flex
                                                items-center
                                                gap-2
                                                min-w-0
                                                hover:underline
                                            "
                                        >
                                            <span className="text-xl shrink-0">
                                                {icoonVoor(naam)}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium truncate">
                                                    {naam}
                                                </span>
                                                <span className="block text-xs text-gray-400">
                                                    {datumNL(item.createdAt)}
                                                </span>
                                            </span>
                                        </a>

                                        {
                                            !readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={()=>verwijder(item.id)}
                                                    className="
                                                        text-gray-400
                                                        hover:text-red-600
                                                        text-sm
                                                        shrink-0
                                                        px-2
                                                    "
                                                    title="Verwijderen"
                                                >
                                                    ✕
                                                </button>
                                            )
                                        }

                                    </li>
                                );

                            })
                        }

                    </ul>
                )
            }


        </section>
    );

}
