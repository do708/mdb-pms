"use client";

import { useEffect, useRef, useState } from "react";
import {
    SpecListRow,
    SpecPageCard,
} from "@/components/ui/SpecLayout";



interface PhotosFormProps {

    workorderId:string;

    // Als de opdracht al verstuurd is: alleen tonen, geen knop om toe te voegen.
    readOnly?:boolean;

}



interface Photo {
    id:string;
    url:string;
    filename?:string | null;
    caption?:string | null;
}


/** Verklein telefoonfoto's in de browser zodat de upload niet stukloopt. */
async function compressForUpload(file:File):Promise<File>{

    if(!file.type.startsWith("image/") || file.type === "image/gif"){
        return file;
    }

    try {

        const bitmap =
            await createImageBitmap(file);

        const maxEdge = 1920;
        const scale =
            Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));

        const width =
            Math.max(1, Math.round(bitmap.width * scale));
        const height =
            Math.max(1, Math.round(bitmap.height * scale));

        const canvas =
            document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx =
            canvas.getContext("2d");

        if(!ctx){
            bitmap.close();
            return file;
        }

        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        const blob =
            await new Promise<Blob | null>((resolve)=>
                canvas.toBlob(resolve, "image/jpeg", 0.82)
            );

        if(!blob){
            return file;
        }

        const naam =
            file.name.replace(/\.[^.]+$/, "") || "foto";

        return new File(
            [blob],
            `${naam}.jpg`,
            { type:"image/jpeg" }
        );

    } catch {

        return file;

    }

}




export default function PhotosForm({

    workorderId,

    readOnly = false

}:PhotosFormProps){


    const fileRef =
        useRef<HTMLInputElement | null>(null);


    const [photos,setPhotos] =
        useState<Photo[]>([]);


    const [uploading,setUploading] =
        useState(false);

    const [sleepActief,setSleepActief] =
        useState(false);




    // Bestaande foto's laden.
    useEffect(()=>{

        async function laad(){
            try {
                const res =
                    await fetch(`/api/workorders/${workorderId}/photos`);
                const data =
                    await res.json();
                if(Array.isArray(data.photos)){
                    setPhotos(data.photos);
                }
            } catch {
                // stil falen
            }
        }

        laad();

    },[workorderId]);




    // Direct uploaden zodra foto's gekozen zijn.
    async function uploadFiles(gekozen: File[]){

        if(gekozen.length === 0){
            return;
        }

        setUploading(true);

        try {

            const formData =
                new FormData();

            for(const photo of gekozen){
                const compressed =
                    await compressForUpload(photo);
                formData.append("photos", compressed);
            }

            const response =
                await fetch(
                    `/api/workorders/${workorderId}/photos`,
                    {
                        method:"POST",
                        body:formData
                    }
                );

            const data =
                await response.json().catch(()=>({}));

            if(response.ok && Array.isArray(data.photos)){
                setPhotos(prev=>[...prev, ...data.photos]);
            } else {
                const reden =
                    typeof data.error === "string" && data.error.trim()
                    ? data.error
                    : `Foto upload mislukt (${response.status})`;
                alert(reden);
            }

        } catch(error){

            console.error(error);
            alert("Fout bij upload foto's");

        } finally {

            setUploading(false);
            if(fileRef.current){
                fileRef.current.value = "";
            }

        }

    }

    async function selectPhotos(
        event:React.ChangeEvent<HTMLInputElement>
    ){

        if(!event.target.files || event.target.files.length === 0){
            return;
        }

        await uploadFiles(Array.from(event.target.files));

    }




    // Bijschrift lokaal bijwerken en opslaan, zodat de naam in de ZIP
    // staat ook zonder het veld te verlaten.
    function setCaption(id:string, caption:string){
        setPhotos(prev=>
            prev.map(p=>
                p.id === id
                ?
                { ...p, caption }
                :
                p
            )
        );
        void saveCaption(id, caption);
    }




    // Bijschrift opslaan (bij verlaten van het veld).
    async function saveCaption(id:string, caption:string){
        try {
            await fetch(
                `/api/workorders/${workorderId}/photos`,
                {
                    method:"PATCH",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify({
                        photoId:id,
                        caption
                    })
                }
            );
        } catch {
            // stil falen; blijft lokaal bewaard
        }
    }




    return (

        <SpecPageCard className="space-y-3">

            <h2 className="font-semibold text-sm text-gray-800 border-b pb-1">
                Foto&apos;s van de installatie
            </h2>

            {
                !readOnly && (
                    <>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={selectPhotos}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={()=>fileRef.current?.click()}
                            disabled={uploading}
                            onDragOver={(e)=>{
                                e.preventDefault();
                                setSleepActief(true);
                            }}
                            onDragLeave={()=>setSleepActief(false)}
                            onDrop={(e)=>{
                                e.preventDefault();
                                setSleepActief(false);
                                const files = Array.from(e.dataTransfer.files || [])
                                    .filter((f)=>f.type.startsWith("image/") || f.size > 0);
                                if(files.length){
                                    void uploadFiles(files);
                                }
                            }}
                            className={`
                                w-full rounded-lg border border-dashed
                                bg-white px-3 py-4
                                text-sm font-medium text-gray-700
                                hover:border-sky-300 hover:bg-sky-50/50
                                disabled:opacity-50
                                flex flex-col items-center gap-1
                                ${sleepActief
                                    ? "border-sky-400 bg-sky-50"
                                    : "border-gray-300"}
                            `}
                        >
                            {
                                uploading
                                ? (
                                    <span>Bezig met uploaden...</span>
                                )
                                : (
                                    <>
                                        <span className="text-2xl" aria-hidden>
                                            📷
                                        </span>
                                        <span>Foto&apos;s toevoegen</span>
                                        <span className="text-xs font-normal text-gray-500">
                                            Tijdens of na het installeren. Klik of sleep foto&apos;s hierheen.
                                        </span>
                                    </>
                                )
                            }
                        </button>
                    </>
                )
            }


            {
                photos.length === 0
                ? (
                    <p className="text-sm text-gray-500">
                        Nog geen foto&apos;s van de installatie.
                    </p>
                )
                : (
                    <div className="
                        grid grid-cols-2 sm:grid-cols-3 gap-2
                    ">
                        {
                            photos.map((photo,index)=>(
                                <SpecListRow
                                    key={photo.id}
                                    className="!p-0 overflow-hidden"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photo.url}
                                        alt={`Foto ${index + 1}`}
                                        className="
                                            w-full h-28 object-cover
                                        "
                                    />
                                    <div className="p-2 space-y-1">
                                        <span className="block text-[11px] text-gray-500">
                                            Naam
                                        </span>
                                        <input
                                            value={photo.caption ?? ""}
                                            placeholder={readOnly ? "" : "Naam van deze foto"}
                                            readOnly={readOnly}
                                            onChange={(e)=>
                                                setCaption(photo.id, e.target.value)
                                            }
                                            onBlur={(e)=>
                                                saveCaption(photo.id, e.target.value)
                                            }
                                            className={`
                                                w-full border border-gray-200
                                                rounded-md px-2 py-1 text-xs
                                                ${readOnly ? "bg-gray-50 border-transparent" : "bg-white"}
                                            `}
                                        />
                                    </div>
                                </SpecListRow>
                            ))
                        }
                    </div>
                )
            }

        </SpecPageCard>

    );

}
