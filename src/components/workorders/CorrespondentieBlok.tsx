"use client";

import { useEffect, useState, useRef } from "react";
import {
    SpecListRow,
    SpecPageCard,
} from "@/components/ui/SpecLayout";


interface Attachment {
    id:string;
    url:string;
    filename:string | null;
    originalName:string | null;
    contentType:string | null;
    createdAt:string;
}

interface ParsedEmailAttachment {
    index:number;
    name:string;
    contentType:string | null;
    size:number | null;
}

interface ParsedEmail {
    from:string | null;
    to:string | null;
    cc:string | null;
    date:string | null;
    subject:string | null;
    bodyHtml:string | null;
    bodyText:string | null;
    attachments:ParsedEmailAttachment[];
}

type ViewerState = {
    item:Attachment;
    naam:string;
    laden:boolean;
    mail:ParsedEmail | null;
    fout:string | null;
    downloadbaar:boolean;
};


interface Props {
    workorderId:string;
    readOnly?:boolean;
}


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


function isEmailBestand(naam:string):boolean {
    const n = naam.toLowerCase();
    return n.endsWith(".msg") || n.endsWith(".eml");
}


function bestandNaam(item:Attachment):string {
    return item.originalName ?? item.filename ?? "bestand";
}


function bestandUrl(workorderId:string, attachmentId:string):string {
    return `/api/workorders/${workorderId}/attachments/${attachmentId}`;
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


function MailRegel({
    label,
    waarde,
}: {
    label:string;
    waarde:string | null;
}) {
    if(!waarde){ return null; }

    return (
        <div className="grid grid-cols-[5.5rem_1fr] gap-2 text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-900 break-words">{waarde}</dd>
        </div>
    );
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

    const [viewer,setViewer] =
        useState<ViewerState | null>(null);

    const [htmlUrl,setHtmlUrl] =
        useState<string | null>(null);

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


    useEffect(()=>{
        if(!viewer?.mail?.bodyHtml){
            setHtmlUrl(null);
            return;
        }

        const blob = new Blob(
            [viewer.mail.bodyHtml],
            { type:"text/html;charset=utf-8" }
        );
        const url = URL.createObjectURL(blob);
        setHtmlUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    },[viewer?.mail?.bodyHtml]);


    useEffect(()=>{
        if(!viewer){ return; }

        function onKey(event:KeyboardEvent){
            if(event.key === "Escape"){
                setViewer(null);
            }
        }

        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    },[viewer]);



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


    async function openItem(item:Attachment){

        const naam = bestandNaam(item);
        const url = bestandUrl(workorderId, item.id);

        if(!isEmailBestand(naam)){
            window.open(url, "_blank", "noopener,noreferrer");
            return;
        }

        setViewer({
            item,
            naam,
            laden:true,
            mail:null,
            fout:null,
            downloadbaar:true,
        });

        try {
            const res = await fetch(`${url}/preview`);
            const data = await res.json().catch(()=>null);

            if(res.status === 404){
                setViewer({
                    item,
                    naam,
                    laden:false,
                    mail:null,
                    fout: data?.error || "Bestand niet gevonden in de opslag",
                    downloadbaar:false,
                });
                return;
            }

            if(!res.ok){
                setViewer({
                    item,
                    naam,
                    laden:false,
                    mail:null,
                    fout: data?.error || "Dit e-mailbestand kon niet worden gelezen",
                    downloadbaar: Boolean(data?.downloadable ?? res.status === 422),
                });
                return;
            }

            setViewer({
                item,
                naam,
                laden:false,
                mail: data as ParsedEmail,
                fout:null,
                downloadbaar:true,
            });
        } catch {
            setViewer({
                item,
                naam,
                laden:false,
                mail:null,
                fout:"E-mail openen mislukt",
                downloadbaar:true,
            });
        }

    }



    return (

        <SpecPageCard className="space-y-3">

            <div className="space-y-0.5 border-b pb-1">
                <h2 className="font-semibold text-sm text-gray-800">
                    Correspondentie &amp; bijlagen
                </h2>
                <p className="text-xs text-gray-500 leading-snug">
                    Sleep hier e-mails (.msg/.eml), PDF&apos;s, foto&apos;s of andere
                    bestanden naartoe om ze bij deze opdracht te bewaren.
                </p>
            </div>


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
                            rounded-lg border border-dashed px-3 py-4
                            text-center cursor-pointer transition bg-white
                            ${sleepActief
                                ? "border-sky-400 bg-sky-50"
                                : "border-gray-300 hover:border-sky-300 hover:bg-sky-50/40"}
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

                        <div className="text-2xl mb-1" aria-hidden>
                            📥
                        </div>

                        <p className="text-sm font-medium text-gray-700">
                            {
                                bezig
                                ?
                                "Bezig met opslaan..."
                                :
                                "Sleep bestanden hierheen of klik om te kiezen"
                            }
                        </p>

                    </div>

                )
            }



            {
                laden
                ?
                (
                    <p className="text-sm text-gray-500">
                        Laden...
                    </p>
                )
                :
                items.length === 0
                ?
                (
                    <p className="text-sm text-gray-500">
                        Nog geen correspondentie bewaard.
                    </p>
                )
                :
                (
                    <ul className="space-y-2">

                        {
                            items.map(item=>{

                                const naam = bestandNaam(item);

                                return (

                                    <li key={item.id}>
                                        <SpecListRow
                                            className="
                                                flex items-center
                                                justify-between gap-2
                                            "
                                        >

                                        <button
                                            type="button"
                                            onClick={()=>openItem(item)}
                                            className="
                                                flex
                                                items-center
                                                gap-2
                                                min-w-0
                                                text-left
                                                hover:underline
                                            "
                                        >
                                            <span className="text-base shrink-0">
                                                {icoonVoor(naam)}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium text-gray-900 truncate">
                                                    {naam}
                                                </span>
                                                <span className="block text-xs text-gray-500">
                                                    {datumNL(item.createdAt)}
                                                </span>
                                            </span>
                                        </button>

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

                                        </SpecListRow>
                                    </li>
                                );

                            })
                        }

                    </ul>
                )
            }


            {
                viewer && (

                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
                        role="presentation"
                        onClick={()=>setViewer(null)}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="mail-viewer-title"
                            className="
                                w-full max-w-3xl max-h-[90vh]
                                flex flex-col
                                rounded-2xl bg-white shadow-xl
                                border border-gray-100
                            "
                            onClick={(e)=>e.stopPropagation()}
                        >

                            <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
                                <div className="min-w-0">
                                    <h2
                                        id="mail-viewer-title"
                                        className="text-base font-semibold text-gray-900 truncate"
                                    >
                                        {viewer.mail?.subject || viewer.naam}
                                    </h2>
                                    <p className="text-xs text-gray-500 truncate">
                                        {viewer.naam}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={()=>setViewer(null)}
                                    className="
                                        text-gray-400 hover:text-gray-700
                                        text-lg leading-none px-1
                                    "
                                    title="Sluiten"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto px-5 py-4 space-y-4 min-h-0">

                                {
                                    viewer.laden
                                    ?
                                    (
                                        <p className="text-sm text-gray-500">
                                            E-mail laden...
                                        </p>
                                    )
                                    :
                                    viewer.fout
                                    ?
                                    (
                                        <div className="space-y-3">
                                            <p className="text-sm text-red-700">
                                                {viewer.fout}
                                            </p>
                                            {
                                                viewer.downloadbaar && (
                                                    <a
                                                        href={bestandUrl(workorderId, viewer.item.id)}
                                                        className="text-sm text-sky-700 hover:underline"
                                                    >
                                                        Bestand downloaden
                                                    </a>
                                                )
                                            }
                                        </div>
                                    )
                                    :
                                    viewer.mail
                                    ?
                                    (
                                        <>
                                            <dl className="space-y-1.5">
                                                <MailRegel label="Van" waarde={viewer.mail.from} />
                                                <MailRegel label="Aan" waarde={viewer.mail.to} />
                                                <MailRegel label="Cc" waarde={viewer.mail.cc} />
                                                <MailRegel
                                                    label="Datum"
                                                    waarde={
                                                        viewer.mail.date
                                                        ? datumNL(viewer.mail.date)
                                                        : null
                                                    }
                                                />
                                                <MailRegel label="Onderwerp" waarde={viewer.mail.subject} />
                                            </dl>

                                            {
                                                viewer.mail.attachments.length > 0 && (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-medium text-gray-500">
                                                            Bijlagen
                                                        </p>
                                                        <ul className="space-y-1">
                                                            {
                                                                viewer.mail.attachments.map(bijlage=>(
                                                                    <li key={bijlage.index}>
                                                                        <a
                                                                            href={`${bestandUrl(workorderId, viewer.item.id)}?nested=${bijlage.index}`}
                                                                            className="text-sm text-sky-700 hover:underline"
                                                                        >
                                                                            📎 {bijlage.name}
                                                                        </a>
                                                                    </li>
                                                                ))
                                                            }
                                                        </ul>
                                                    </div>
                                                )
                                            }

                                            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                                                {
                                                    htmlUrl
                                                    ?
                                                    (
                                                        <iframe
                                                            title="E-mailinhoud"
                                                            src={htmlUrl}
                                                            sandbox=""
                                                            className="w-full h-[50vh] bg-white"
                                                        />
                                                    )
                                                    :
                                                    viewer.mail.bodyText
                                                    ?
                                                    (
                                                        <pre className="whitespace-pre-wrap break-words p-3 text-sm text-gray-800 font-sans">
                                                            {viewer.mail.bodyText}
                                                        </pre>
                                                    )
                                                    :
                                                    (
                                                        <p className="p-3 text-sm text-gray-500">
                                                            Geen inhoud in dit bericht.
                                                        </p>
                                                    )
                                                }
                                            </div>
                                        </>
                                    )
                                    :
                                    null
                                }

                            </div>

                            <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-3">
                                {
                                    viewer.downloadbaar && (
                                        <a
                                            href={bestandUrl(workorderId, viewer.item.id)}
                                            className="
                                                text-sm font-medium
                                                rounded-xl px-4 py-2
                                                border border-gray-200 text-gray-700
                                                hover:bg-gray-50
                                            "
                                        >
                                            Origineel downloaden
                                        </a>
                                    )
                                }
                                <button
                                    type="button"
                                    onClick={()=>setViewer(null)}
                                    className="
                                        text-sm font-semibold
                                        rounded-xl px-4 py-2
                                        bg-gray-900 text-white
                                        hover:bg-gray-800
                                    "
                                >
                                    Sluiten
                                </button>
                            </div>

                        </div>
                    </div>

                )
            }


        </SpecPageCard>
    );

}
