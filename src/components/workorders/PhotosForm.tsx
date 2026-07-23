"use client";

import { useState } from "react";



interface PhotosFormProps {

    workorderId:string;

}






export default function PhotosForm({

    workorderId

}:PhotosFormProps){



    const [photos,setPhotos] =
        useState<File[]>([]);



    const [saving,setSaving] =
        useState(false);







    function selectPhotos(

        event:React.ChangeEvent<HTMLInputElement>

    ){


        if(event.target.files){


            setPhotos(

                Array.from(
                    event.target.files
                )

            );


        }


    }









    async function uploadPhotos(){


        if(photos.length === 0){


            alert(
                "Selecteer eerst foto's"
            );


            return;

        }





        setSaving(true);




        try {


            const formData =
                new FormData();



            photos.forEach(photo=>{


                formData.append(

                    "photos",

                    photo

                );


            });





            const response =
                await fetch(

                    `/api/workorders/${workorderId}/photos`,

                    {

                        method:"POST",

                        body:formData

                    }

                );






            if(response.ok){


                alert(
                    "Foto's opgeslagen"
                );


                setPhotos([]);


            } else {


                alert(
                    "Foto upload mislukt"
                );


            }




        } catch(error){


            console.error(error);


            alert(
                "Fout bij upload foto's"
            );


        } finally {


            setSaving(false);


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

                📷 Foto's

            </h2>






            <input

                type="file"

                accept="image/*"

                multiple


                onChange={selectPhotos}


                className="
                    w-full
                    border
                    rounded-xl
                    p-3
                "

            />








            {
                photos.map((photo,index)=>(


                    <div

                        key={index}

                        className="
                            bg-gray-50
                            rounded-xl
                            p-3
                        "

                    >

                        📷 {photo.name}


                    </div>


                ))

            }








            <button

                onClick={uploadPhotos}

                disabled={saving}


                className="
                    w-full
                    bg-blue-600
                    text-white
                    rounded-xl
                    py-3
                    font-bold
                "

            >

                {
                    saving
                    ?
                    "Uploaden..."
                    :
                    "📷 Foto's opslaan"
                }


            </button>




        </section>

    );


}