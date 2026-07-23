"use client";

import { useState } from "react";



interface HoursFormProps {

    workorderId:string;

}






export default function HoursForm({

    workorderId

}:HoursFormProps){



    const [hours,setHours] =
        useState("");



    const [travelTime,setTravelTime] =
        useState("");



    const [kilometers,setKilometers] =
        useState("");



    const [hotel,setHotel] =
        useState(false);



    const [saving,setSaving] =
        useState(false);








    async function saveHours(){


        setSaving(true);



        try {



            const response =
                await fetch(

                    `/api/workorders/${workorderId}/hours`,

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:JSON.stringify({

                            date:new Date(),

                            hours,

                            travelTime,

                            kilometers,

                            hotel

                        })


                    }

                );





            if(response.ok){


                alert(
                    "Uren opgeslagen"
                );


                setHours("");

                setTravelTime("");

                setKilometers("");

                setHotel(false);



            } else {


                alert(
                    "Uren opslaan mislukt"
                );


            }





        } catch(error){


            console.error(error);


            alert(
                "Fout bij opslaan uren"
            );


        } finally {


            setSaving(false);


        }


    }







    return (

        <section className="
            bg-white
            rounded-2xl
            border
            p-5
            space-y-4
        ">


            <h2 className="
                font-bold
                text-lg
            ">

                ⏱ Urenregistratie

            </h2>





            <input

                type="number"

                placeholder="Aantal uren"

                value={hours}

                onChange={(e)=>
                    setHours(
                        e.target.value
                    )
                }

                className="
                    w-full
                    border
                    rounded-xl
                    p-3
                "

            />





            <input

                type="number"

                placeholder="Reistijd"

                value={travelTime}

                onChange={(e)=>
                    setTravelTime(
                        e.target.value
                    )
                }

                className="
                    w-full
                    border
                    rounded-xl
                    p-3
                "

            />





            <input

                type="number"

                placeholder="Kilometers"

                value={kilometers}

                onChange={(e)=>
                    setKilometers(
                        e.target.value
                    )
                }

                className="
                    w-full
                    border
                    rounded-xl
                    p-3
                "

            />






            <label className="
                flex
                gap-2
                items-center
            ">


                <input

                    type="checkbox"

                    checked={hotel}

                    onChange={(e)=>
                        setHotel(
                            e.target.checked
                        )
                    }

                />


                Hotel overnachting


            </label>








            <button

                onClick={saveHours}

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
                    "Opslaan..."
                    :
                    "⏱ Uren opslaan"
                }


            </button>




        </section>

    );


}