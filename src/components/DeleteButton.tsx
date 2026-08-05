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

}



export default function DeleteButton({

    url,

    label,

    onDeleted,

    compact = false,

    toolbar = false

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

            <span className="
                inline-flex
                items-center
                gap-2
            ">

                <span className="text-sm text-gray-600">

                    {label} verwijderen?

                </span>

                <button

                    type="button"

                    onClick={remove}

                    disabled={busy}

                    className="
                        text-sm
                        bg-red-600
                        text-white
                        rounded-lg
                        px-3
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
                        text-sm
                        text-gray-500
                        underline
                    "

                >

                    Annuleren

                </button>

            </span>

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

            title="Verwijderen"

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

            {compact ? "🗑" : "Verwijderen"}

        </button>

    );

}
