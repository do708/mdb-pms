"use client";

import { useEffect, useState } from "react";

import { PlanningStatusIcon } from "@/components/planning/PlanningStatusIcon";
import {
    WORKORDER_FLOW_STATUSES,
    getStatus
} from "@/constants/workorderStatus";



interface Props {

    workorderId:string;

    current:string;

    // Aangeroepen na een geslaagde statuswijziging
    onChanged?:(status:string)=>void;

}



// Klikbare statusbalk voor kantoor/admin. Toont waar de werkbon staat
// en laat je naar de volgende (of een andere) status springen.

export default function StatusFlow({

    workorderId,

    current,

    onChanged

}:Props){


    const [status,setStatus] =
        useState(current);


    const [busy,setBusy] =
        useState(false);

    useEffect(() => {
        setStatus(current);
    }, [current]);




    const currentIndex =
        WORKORDER_FLOW_STATUSES.findIndex(
            s=>s.key === status
        );




    async function setTo(
        key:string
    ){


        if(key === status){
            return;
        }


        setBusy(true);


        try {


            const response =
                await fetch(

                    `/api/workorders/${workorderId}`,

                    {

                        method:"PUT",

                        headers:{
                            "Content-Type":"application/json"
                        },

                        body:JSON.stringify({
                            status:key
                        })

                    }

                );


            if(response.ok){

                setStatus(key);

                if(onChanged){
                    onChanged(key);
                }

            } else {

                const data =
                    await response
                    .json()
                    .catch(()=>({}));

                alert(
                    data.error ??
                    "Status wijzigen mislukt"
                );

            }


        } finally {

            setBusy(false);

        }


    }




    const nextStatus =
        currentIndex >= 0
            ? WORKORDER_FLOW_STATUSES[currentIndex + 1]
            : WORKORDER_FLOW_STATUSES[0];




    return (

        <div className="space-y-4">


            {/* huidige status groot */}

            <div className="
                flex
                items-center
                gap-3
                flex-wrap
            ">

                <span className={`
                    inline-flex
                    items-center
                    gap-1.5
                    px-3
                    py-1
                    rounded-full
                    text-sm
                    font-medium
                    ${getStatus(status).badge}
                `}>

                    <PlanningStatusIcon status={status} className="h-3.5 w-3.5" />

                    {getStatus(status).label}

                </span>


                {
                    nextStatus && (

                        <button

                            type="button"

                            onClick={()=>setTo(nextStatus.key)}

                            disabled={busy}

                            className="
                                text-sm
                                bg-black
                                text-white
                                rounded-lg
                                px-3
                                py-1.5
                                disabled:opacity-50
                            "

                        >

                            {busy ? "Bezig..." : `→ ${nextStatus.label}`}

                        </button>

                    )
                }

            </div>




            {/* Lineaire stappen links; On Hold rechts uitgelijnd */}

            <div className="
                flex
                flex-wrap
                items-center
                gap-2
            ">

                {
                    WORKORDER_FLOW_STATUSES.map((step,index)=>{


                        const done =
                            currentIndex >= 0 && index < currentIndex;

                        const active =
                            step.key === status;


                        return (

                            <button

                                key={step.key}

                                type="button"

                                onClick={()=>setTo(step.key)}

                                disabled={busy}

                                title={step.label}

                                className={`
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    text-xs
                                    rounded-full
                                    px-3
                                    py-1
                                    border
                                    disabled:opacity-50
                                    ${
                                        active
                                        ?
                                        "bg-black text-white border-black"
                                        :
                                        done
                                        ?
                                        "bg-gray-100 text-gray-700 border-gray-200"
                                        :
                                        "text-gray-400 border-gray-200"
                                    }
                                `}

                            >

                                <PlanningStatusIcon
                                    status={step.key}
                                    className="h-3 w-3"
                                />

                                {index + 1}. {step.label}

                            </button>

                        );

                    })
                }

                <button
                    type="button"
                    onClick={()=>setTo("on_hold")}
                    disabled={busy}
                    title="On Hold"
                    className={`
                        ml-auto
                        inline-flex
                        items-center
                        gap-1.5
                        text-xs
                        rounded-full
                        px-3
                        py-1
                        border
                        disabled:opacity-50
                        ${
                            status === "on_hold"
                            ?
                            "bg-amber-500 text-white border-amber-500"
                            :
                            "text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100"
                        }
                    `}
                >
                    <PlanningStatusIcon
                        status="on_hold"
                        className="h-3 w-3"
                    />
                    On Hold
                </button>

            </div>


        </div>

    );


}
