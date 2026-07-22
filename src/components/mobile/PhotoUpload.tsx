"use client";

import { useState } from "react";
import { Camera } from "lucide-react";


interface PhotoUploadProps {

    workorderId:string;

}



export default function PhotoUpload({

    workorderId

}:PhotoUploadProps) {


    const [uploading, setUploading] =
        useState(false);


    const [message, setMessage] =
        useState("");





    async function handleUpload(

        event: React.ChangeEvent<HTMLInputElement>

    ) {


        const file =
            event.target.files?.[0];



        if(!file){

            return;

        }



        try {


            setUploading(true);

            setMessage("");



            // 1. Upload bestand naar Supabase

            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );



            const uploadResponse =
                await fetch(

                    "/api/upload",

                    {

                        method:"POST",

                        body:formData

                    }

                );





            const uploadData =
                await uploadResponse.json();





            if(!uploadResponse.ok){


                throw new Error(

                    uploadData.error ||

                    "Upload mislukt"

                );


            }






            // 2. Koppel foto aan werkbon

            const photoResponse =
                await fetch(

                    `/api/workorders/${workorderId}/photos`,

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:JSON.stringify({

                            url:
                                uploadData.url,


                            filename:
                                uploadData.filename


                        })

                    }

                );






            const photoData =
                await photoResponse.json();





            if(!photoResponse.ok){


                throw new Error(

                    photoData.error ||

                    "Foto opslaan mislukt"

                );


            }






            setMessage(

                "✓ Foto opgeslagen"

            );





        } catch(error){


            console.error(error);


            setMessage(

                "Foto upload mislukt"

            );



        } finally {


            setUploading(false);


        }


    }






    return (

        <div className="space-y-3">


            <label className="
                flex
                items-center
                justify-center
                gap-2
                border
                rounded-xl
                p-4
                cursor-pointer
            ">


                <Camera size={20}/>


                {uploading

                    ? "Uploaden..."

                    : "Foto toevoegen"

                }



                <input

                    type="file"

                    accept="image/*"

                    capture="environment"

                    onChange={handleUpload}

                    className="hidden"

                />


            </label>




            {message && (

                <p className="
                    text-sm
                    text-green-600
                    text-center
                ">

                    {message}

                </p>

            )}



        </div>

    );

}