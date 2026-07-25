"use client";

import { useEffect, useRef, useState } from "react";

import { useSession } from "next-auth/react";

import { Bell } from "lucide-react";



interface Item {

    id:string;

    number:string;

    title:string;

    plannedDate:string | null;

    customer:{ name:string } | null;

    project:{ customer:{ name:string } | null } | null;

    assignedUser:{ name:string | null } | null;

}



export default function NotificationBell(){


    const { data:session } =
        useSession();


    const role =
        session?.user?.role;


    const canSee =
        role === "admin" ||
        role === "office";


    const [items,setItems] =
        useState<Item[]>([]);


    const [open,setOpen] =
        useState(false);


    const containerRef =
        useRef<HTMLDivElement | null>(null);




    async function load(){


        try {


            const response =
                await fetch("/api/notifications");


            if(!response.ok){
                return;
            }


            const data =
                await response.json();


            setItems(
                Array.isArray(data.items)
                ?
                data.items
                :
                []
            );


        } catch {

            // stil falen; de bel toont dan gewoon geen meldingen

        }


    }




    useEffect(()=>{

        if(!canSee){
            return;
        }

        load();

        // elke 5 minuten verversen
        const timer =
            setInterval(load, 5 * 60 * 1000);

        return ()=>clearInterval(timer);

    },[canSee]);




    // buiten de dropdown klikken sluit hem
    useEffect(()=>{


        function onClick(event:MouseEvent){

            if(
                containerRef.current &&
                !containerRef.current.contains(
                    event.target as Node
                )
            ){
                setOpen(false);
            }

        }


        document.addEventListener("mousedown",onClick);

        return ()=>
            document.removeEventListener("mousedown",onClick);


    },[]);




    const count =
        items.length;


    if(!canSee){
        return null;
    }




    return (

        <div
            ref={containerRef}
            className="relative"
        >


            <button

                onClick={()=>setOpen(o=>!o)}

                className="
                    relative
                    p-2
                    rounded-full
                    hover:bg-gray-100
                    transition
                "

            >

                <Bell size={21}/>


                {
                    count > 0 && (

                        <span className="
                            absolute
                            -top-0.5
                            -right-0.5
                            min-w-[18px]
                            h-[18px]
                            px-1
                            bg-[#d6007e]
                            text-white
                            text-[10px]
                            font-bold
                            rounded-full
                            flex
                            items-center
                            justify-center
                        ">

                            {count}

                        </span>

                    )
                }

            </button>




            {
                open && (

                    <div className="
                        absolute
                        right-0
                        mt-2
                        w-96
                        max-w-[90vw]
                        bg-white
                        border
                        rounded-2xl
                        shadow-lg
                        z-50
                        overflow-hidden
                    ">


                        <div className="
                            px-4
                            py-3
                            border-b
                            font-bold
                        ">

                            Te laat met invullen

                        </div>


                        {
                            count === 0
                            ?

                            (

                                <p className="
                                    px-4
                                    py-6
                                    text-sm
                                    text-gray-500
                                    text-center
                                ">

                                    Niets te laat. 👍

                                </p>

                            )
                            :

                            (

                                <div className="
                                    max-h-96
                                    overflow-auto
                                ">

                                    {
                                        items.map(item=>(

                                            <a

                                                key={item.id}

                                                href={`/workorders/${item.id}`}

                                                className="
                                                    block
                                                    px-4
                                                    py-3
                                                    border-b
                                                    hover:bg-red-50
                                                "

                                            >

                                                <p className="
                                                    font-medium
                                                    text-sm
                                                ">

                                                    {item.number} — {item.title}

                                                </p>

                                                <p className="
                                                    text-xs
                                                    text-gray-500
                                                    mt-0.5
                                                ">

                                                    👷 {item.assignedUser?.name ?? "Geen monteur"}

                                                    {" · gepland "}

                                                    {
                                                        item.plannedDate
                                                        ?
                                                        new Date(item.plannedDate)
                                                            .toLocaleDateString("nl-NL")
                                                        :
                                                        "—"
                                                    }

                                                </p>

                                            </a>

                                        ))
                                    }

                                </div>

                            )
                        }


                    </div>

                )
            }


        </div>

    );

}
