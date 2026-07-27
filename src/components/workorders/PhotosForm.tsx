"use client";

import { useEffect, useRef, useState } from "react";



interface PhotosFormProps {

    workorderId:string;

}



interface Photo {
    id:string;
    url:string;
    filename?:string | null;
    caption?:string | null;
}




export default function PhotosForm({

    workorderId

}:PhotosFormProps){


    const fileRef =
        useRef<HTMLInputElement | null>(null);


    const [photos,setPhotos] =
        useState<Photo[]>([]);


    const [uploading,setUploading] =
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
    async function selectPhotos(
        event:React.ChangeEvent<HTMLInputElement>
    ){

        if(!event.target.files || event.target.files.length === 0){
            return;
        }

        const gekozen =
            Array.from(event.target.files);

        setUploading(true);

        try {

            const formData =
                new FormData();

            gekozen.forEach(photo=>{
                formData.append("photos", photo);
            });

            const response =
                await fetch(
                    `/api/workorders/${workorderId}/photos`,
                    {
                        method:"POST",
                        body:formData
                    }
                );

            const data =
                await response.json();

            if(response.ok && Array.isArray(data.photos)){
                setPhotos(prev=>[...prev, ...data.photos]);
            } else {
                alert("Foto upload mislukt");
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




    // Bijschrift lokaal bijwerken.
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

        <section className="
            bg-white
            border
            rounded-2xl
            p-5
            space-y-4
        ">


            <h2 className="
                font-bold
                text-lg
            ">
                📷 Foto&apos;s
            </h2>


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
                className="
                    w-full
                    border-2
                    border-dashed
                    border-gray-300
                    rounded-xl
                    p-4
                    text-gray-600
                    hover:bg-gray-50
                    disabled:opacity-50
                "
            >
                {
                    uploading
                    ?
                    "Bezig met uploaden..."
                    :
                    "📷 Foto's toevoegen"
                }
            </button>


            {
                photos.length > 0 && (

                    <div className="
                        grid
                        grid-cols-2
                        sm:grid-cols-3
                        gap-3
                    ">

                        {
                            photos.map((photo,index)=>(

                                <div
                                    key={photo.id}
                                    className="
                                        border
                                        rounded-xl
                                        overflow-hidden
                                        bg-gray-50
                                    "
                                >

                                    <img
                                        src={photo.url}
                                        alt={`Foto ${index + 1}`}
                                        className="
                                            w-full
                                            h-28
                                            object-cover
                                        "
                                    />

                                    <div className="p-2">
                                        <input
                                            value={photo.caption ?? ""}
                                            placeholder="Wat is dit?"
                                            onChange={(e)=>
                                                setCaption(photo.id, e.target.value)
                                            }
                                            onBlur={(e)=>
                                                saveCaption(photo.id, e.target.value)
                                            }
                                            className="
                                                w-full
                                                border
                                                rounded-lg
                                                p-1.5
                                                text-sm
                                            "
                                        />
                                    </div>

                                </div>

                            ))
                        }

                    </div>

                )
            }


        </section>

    );

}
