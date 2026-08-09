"use client";

import { useState } from "react";



interface Props {

    // Endpoint dat de DELETE ontvangt, bijv. /api/customers/123
    url:string;

    // Waar het over gaat, voor de bevestiging: "klant Axians"
    label:string;

    // Aangeroepen na een geslaagde verwijdering
    onDeleted:()=>void;

    // Compacte variant (icoon) voor in lijstrijen
    compact?:boolean;

    // Zelfde hoogte als andere toolbar-knoppen (export, wijzigen)
    toolbar?:boolean;

    // Tooltip / title op de knop (bijv. "Prullenbak")
    title?:string;

}



export default function DeleteButton({

    url,

    label,

    onDeleted,

    compact = false,

    toolbar = false,

    title = "Verwijderen"

}:Props){


    const [busy,setBusy] =
        useState(false);


    const [confirming,setConfirming] =
        useState(false);




    async function remove(){


        setBusy(true);


        try {


            const response =
                await fetch(url,{
                    method:"DELETE"
                });


            const data =
                await response
                .json()
                .catch(()=>({}));


            if(response.ok){


                // Server kan besluiten te deactiveren i.p.v. verwijderen
                if(data.message){

                    alert(data.message);

                }


                onDeleted();


            } else {


                alert(
                    data.error ??
                    "Verwijderen mislukt"
                );


            }


        } finally {

            setBusy(false);

            setConfirming(false);

        }


    }




    if(confirming){

        return (

            <div className="
                w-full
                basis-full
                min-w-0
                rounded-lg
                border
                border-red-200
                bg-red-50
                px-2.5
                py-2
                space-y-2
            ">

                <p className="
                    text-xs
                    text-gray-700
                    leading-snug
                    break-words
                ">

                    {label} verwijderen?

                </p>

                <div className="flex flex-wrap items-center gap-2">

                    <button

                        type="button"

                        onClick={remove}

                        disabled={busy}

                        className="
                            text-xs
                            font-semibold
                            bg-red-600
                            text-white
                            rounded-md
                            px-2.5
                            py-1
                            disabled:opacity-50
                        "

                    >

                        {busy ? "Bezig..." : "Ja, verwijderen"}

                    </button>

                    <button

                        type="button"

                        onClick={()=>setConfirming(false)}

                        disabled={busy}

                        className="
                            text-xs
                            text-gray-600
                            underline
                        "

                    >

                        Annuleren

                    </button>

                </div>

            </div>

        );

    }




    return (

        <button

            type="button"

            onClick={(e)=>{
                e.preventDefault();
                e.stopPropagation();
                setConfirming(true);
            }}

            title={title}

            aria-label={title}

            className={
                compact
                ?
                "text-red-500 hover:text-red-700 text-lg px-2"
                :
                toolbar
                ?
                "text-sm font-bold text-red-700 border border-red-300 rounded-xl px-4 py-3 min-h-[48px] hover:bg-red-50 flex items-center justify-center"
                :
                "text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
            }

        >

            {compact ? "🗑" : title}

        </button>

    );

}
