"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";



export default function EditCustomerPage(){


    const params =
        useParams();


    const router =
        useRouter();


    const id =
        params.id as string;


    const [name,setName] =
        useState("");


    const [email,setEmail] =
        useState("");


    const [phone,setPhone] =
        useState("");


    const [address,setAddress] =
        useState("");


    const [color,setColor] =
        useState("#2563eb");


    const [loading,setLoading] =
        useState(true);


    const [saving,setSaving] =
        useState(false);




    useEffect(()=>{

        async function load(){

            const response =
                await fetch(`/api/customers/${id}`);

            if(response.ok){

                const c =
                    await response.json();

                setName(c.name ?? "");
                setEmail(c.email ?? "");
                setPhone(c.phone ?? "");
                setAddress(c.address ?? "");
                setColor(c.color ?? "#2563eb");

            }

            setLoading(false);

        }

        load();

    },[id]);




    async function save(){

        if(!name){
            alert("Naam is verplicht");
            return;
        }

        setSaving(true);

        const response =
            await fetch(`/api/customers/${id}`,{
                method:"PUT",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    name,
                    email,
                    phone,
                    address,
                    color
                })
            });

        setSaving(false);

        if(response.ok){
            router.push("/customers");
        } else {
            const data =
                await response.json().catch(()=>({}));
            alert(data.error ?? "Wijzigen mislukt");
        }

    }




    if(loading){

        return (
            <main className="p-6">
                Laden...
            </main>
        );

    }




    return (

        <main className="
            p-6
            max-w-lg
            space-y-5
        ">


            <header>

                <h1 className="
                    text-2xl
                    font-bold
                ">

                    Klant wijzigen

                </h1>

                <p className="text-gray-500">

                    Pas gegevens en kleur aan

                </p>

            </header>




            <label className="block">

                <span className="text-sm text-gray-600">

                    Naam

                </span>

                <input

                    value={name}

                    onChange={(e)=>setName(e.target.value)}

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                        mt-1
                    "

                />

            </label>




            <label className="block">

                <span className="text-sm text-gray-600">

                    E-mail

                </span>

                <input

                    value={email}

                    onChange={(e)=>setEmail(e.target.value)}

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                        mt-1
                    "

                />

            </label>




            <label className="block">

                <span className="text-sm text-gray-600">

                    Telefoon

                </span>

                <input

                    value={phone}

                    onChange={(e)=>setPhone(e.target.value)}

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                        mt-1
                    "

                />

            </label>




            <label className="block">

                <span className="text-sm text-gray-600">

                    Adres

                </span>

                <textarea

                    value={address}

                    onChange={(e)=>setAddress(e.target.value)}

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                        mt-1
                        min-h-24
                    "

                />

            </label>




            <div className="
                flex
                items-center
                gap-3
            ">

                <span className="text-sm text-gray-600">

                    Kleur in de planning

                </span>

                <input

                    type="color"

                    value={color}

                    onChange={(e)=>setColor(e.target.value)}

                    className="
                        h-10
                        w-16
                        border
                        rounded-lg
                        cursor-pointer
                    "

                />

                <span

                    className="
                        inline-block
                        w-8
                        h-8
                        rounded-full
                        border
                    "

                    style={{ backgroundColor:color }}

                />

            </div>




            <div className="
                flex
                gap-3
            ">

                <button

                    type="button"

                    onClick={save}

                    disabled={saving}

                    className="
                        bg-blue-600
                        text-white
                        rounded-xl
                        px-5
                        py-2.5
                        font-medium
                        disabled:opacity-50
                    "

                >

                    {saving ? "Opslaan..." : "Opslaan"}

                </button>


                <button

                    type="button"

                    onClick={()=>router.push("/customers")}

                    className="
                        border
                        rounded-xl
                        px-5
                        py-2.5
                    "

                >

                    Annuleren

                </button>

            </div>


        </main>

    );

}
