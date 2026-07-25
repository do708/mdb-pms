"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Search } from "lucide-react";



interface Results {
    workorders:any[];
    forms:any[];
    users:any[];
    customers:any[];
}


const EMPTY:Results = {
    workorders:[],
    forms:[],
    users:[],
    customers:[]
};



export default function SearchBox(){


    const router =
        useRouter();


    const [query,setQuery] =
        useState("");


    const [results,setResults] =
        useState<Results>(EMPTY);


    const [open,setOpen] =
        useState(false);


    const [loading,setLoading] =
        useState(false);


    const boxRef =
        useRef<HTMLDivElement>(null);




    // Zoeken met een kleine vertraging (debounce)
    useEffect(()=>{

        if(query.trim().length < 2){
            setResults(EMPTY);
            return;
        }

        setLoading(true);

        const timer =
            setTimeout(async()=>{

                try {

                    const response =
                        await fetch(
                            `/api/search?q=${encodeURIComponent(query.trim())}`
                        );

                    if(response.ok){
                        setResults(await response.json());
                    }

                } finally {
                    setLoading(false);
                }

            },250);

        return ()=>clearTimeout(timer);

    },[query]);




    // Sluiten bij klik buiten de box
    useEffect(()=>{

        function onClick(e:MouseEvent){
            if(
                boxRef.current &&
                !boxRef.current.contains(e.target as Node)
            ){
                setOpen(false);
            }
        }

        document.addEventListener("mousedown",onClick);

        return ()=>document.removeEventListener("mousedown",onClick);

    },[]);




    function go(url:string){
        setOpen(false);
        setQuery("");
        setResults(EMPTY);
        router.push(url);
    }




    const total =
        results.workorders.length +
        results.forms.length +
        results.users.length +
        results.customers.length;




    return (

        <div
            ref={boxRef}
            className="relative"
        >


            <div className="
                flex
                items-center
                w-[420px]
                h-11
                bg-gray-50
                border
                border-gray-200
                rounded-xl
                px-4
            ">

                <Search
                    size={19}
                    className="text-gray-400"
                />

                <input

                    type="text"

                    value={query}

                    onChange={(e)=>{
                        setQuery(e.target.value);
                        setOpen(true);
                    }}

                    onFocus={()=>setOpen(true)}

                    placeholder="Zoeken..."

                    className="
                        ml-3
                        w-full
                        bg-transparent
                        outline-none
                        text-sm
                        text-gray-700
                    "

                />

            </div>




            {
                open && query.trim().length >= 2 && (

                    <div className="
                        absolute
                        top-12
                        left-0
                        w-[420px]
                        max-h-[70vh]
                        overflow-y-auto
                        bg-white
                        border
                        border-gray-200
                        rounded-xl
                        shadow-lg
                        z-50
                        p-2
                    ">


                        {
                            loading && (
                                <p className="text-sm text-gray-400 p-3">
                                    Zoeken...
                                </p>
                            )
                        }


                        {
                            !loading && total === 0 && (
                                <p className="text-sm text-gray-400 p-3">
                                    Niets gevonden voor &quot;{query}&quot;
                                </p>
                            )
                        }


                        {
                            results.workorders.length > 0 && (

                                <div className="mb-1">

                                    <p className="
                                        text-xs
                                        font-semibold
                                        text-gray-400
                                        px-3
                                        pt-2
                                        pb-1
                                    ">
                                        Werkbonnen
                                    </p>

                                    {
                                        results.workorders.map(w=>(

                                            <button

                                                key={w.id}

                                                onClick={()=>go(`/workorders/${w.id}`)}

                                                className="
                                                    w-full
                                                    text-left
                                                    px-3
                                                    py-2
                                                    rounded-lg
                                                    hover:bg-gray-50
                                                    text-sm
                                                "

                                            >

                                                📋 {w.number} — {w.title}

                                                <span className="text-gray-400">
                                                    {" "}· {w.customer?.name ?? "—"}
                                                </span>

                                            </button>

                                        ))
                                    }

                                </div>

                            )
                        }


                        {
                            results.forms.length > 0 && (

                                <div className="mb-1">

                                    <p className="
                                        text-xs
                                        font-semibold
                                        text-gray-400
                                        px-3
                                        pt-2
                                        pb-1
                                    ">
                                        Formulieren
                                    </p>

                                    {
                                        results.forms.map(f=>(

                                            <button

                                                key={f.id}

                                                onClick={()=>go(`/forms/${f.id}`)}

                                                className="
                                                    w-full
                                                    text-left
                                                    px-3
                                                    py-2
                                                    rounded-lg
                                                    hover:bg-gray-50
                                                    text-sm
                                                "

                                            >

                                                📝 {f.title}

                                                <span className="text-gray-400">
                                                    {" "}· {f.user?.name ?? "—"}
                                                </span>

                                            </button>

                                        ))
                                    }

                                </div>

                            )
                        }


                        {
                            results.users.length > 0 && (

                                <div className="mb-1">

                                    <p className="
                                        text-xs
                                        font-semibold
                                        text-gray-400
                                        px-3
                                        pt-2
                                        pb-1
                                    ">
                                        Gebruikers
                                    </p>

                                    {
                                        results.users.map(u=>(

                                            <button

                                                key={u.id}

                                                onClick={()=>go(`/users/${u.id}`)}

                                                className="
                                                    w-full
                                                    text-left
                                                    px-3
                                                    py-2
                                                    rounded-lg
                                                    hover:bg-gray-50
                                                    text-sm
                                                "

                                            >

                                                👤 {u.name ?? u.email}

                                                <span className="text-gray-400">
                                                    {" "}· {u.role}
                                                </span>

                                            </button>

                                        ))
                                    }

                                </div>

                            )
                        }


                        {
                            results.customers.length > 0 && (

                                <div className="mb-1">

                                    <p className="
                                        text-xs
                                        font-semibold
                                        text-gray-400
                                        px-3
                                        pt-2
                                        pb-1
                                    ">
                                        Klanten
                                    </p>

                                    {
                                        results.customers.map(c=>(

                                            <button

                                                key={c.id}

                                                onClick={()=>go(`/customers/${c.id}/edit`)}

                                                className="
                                                    w-full
                                                    text-left
                                                    px-3
                                                    py-2
                                                    rounded-lg
                                                    hover:bg-gray-50
                                                    text-sm
                                                "

                                            >

                                                🏢 {c.name}

                                            </button>

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
