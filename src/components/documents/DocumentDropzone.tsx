"use client";

import { useRef, useState } from "react";



interface Props {

    onUploaded:()=>void;

}



export default function DocumentDropzone({

    onUploaded

}:Props){


    const inputRef =
        useRef<HTMLInputElement | null>(null);


    const [dragging,setDragging] =
        useState(false);


    const [busy,setBusy] =
        useState(false);


    const [error,setError] =
        useState("");




    async function uploadFiles(
        files:FileList | File[]
    ){


        setError("");

        setBusy(true);


        try {


            for(const file of Array.from(files)){


                const body =
                    new FormData();

                body.append("file",file);


                const response =
                    await fetch(
                        "/api/documents",
                        {
                            method:"POST",
                            body
                        }
                    );


                if(!response.ok){

                    const data =
                        await response
                        .json()
                        .catch(()=>({}));

                    setError(
                        data.error ??
                        `Uploaden van ${file.name} mislukt`
                    );

                    break;

                }


            }


            onUploaded();


        } finally {

            setBusy(false);

        }


    }




    return (

        <div>


            <div

                onDragOver={(e)=>{
                    e.preventDefault();
                    setDragging(true);
                }}

                onDragLeave={()=>setDragging(false)}

                onDrop={(e)=>{
                    e.preventDefault();
                    setDragging(false);

                    if(e.dataTransfer.files?.length){
                        uploadFiles(e.dataTransfer.files);
                    }
                }}

                onClick={()=>inputRef.current?.click()}

                className={`
                    border-2
                    border-dashed
                    rounded-2xl
                    p-8
                    text-center
                    cursor-pointer
                    transition
                    ${
                        dragging
                        ?
                        "border-blue-400 bg-blue-50"
                        :
                        "border-gray-300 hover:bg-gray-50"
                    }
                `}

            >


                <p className="text-4xl mb-2">

                    📁

                </p>


                <p className="font-medium">

                    {
                        busy
                        ?
                        "Bezig met uploaden..."
                        :
                        "Sleep bestanden hierheen"
                    }

                </p>


                <p className="text-sm text-gray-500 mt-1">

                    of klik om te bladeren

                </p>


                <input

                    ref={inputRef}

                    type="file"

                    multiple

                    className="hidden"

                    onChange={(e)=>{
                        if(e.target.files?.length){
                            uploadFiles(e.target.files);
                        }
                        e.target.value = "";
                    }}

                />


            </div>


            {
                error && (

                    <p className="
                        text-sm
                        text-red-600
                        mt-2
                    ">

                        {error}

                    </p>

                )
            }


        </div>

    );

}
