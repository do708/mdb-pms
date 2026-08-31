"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import {
    STAFF_KIND_LABELS,
    STAFF_KINDS,
    parseStaffKind,
    type StaffKind,
} from "@/constants/staffKind";



export default function EditUserPage(){


    const router =
        useRouter();


    const params =
        useParams();


    const id =
        params.id as string;




    const [name,setName] =
        useState("");


    const [email,setEmail] =
        useState("");


    const [password,setPassword] =
        useState("");


    const [role,setRole] =
        useState("engineer");

    const [staffKind,setStaffKind] =
        useState<StaffKind>("monteur");

    const [stagiaireUntil,setStagiaireUntil] =
        useState("");


    const [active,setActive] =
        useState(true);


    const [loading,setLoading] =
        useState(true);


    const [saving,setSaving] =
        useState(false);


    const [error,setError] =
        useState("");




    useEffect(()=>{


        async function load(){


            const response =
                await fetch(
                    `/api/users/${id}`
                );


            if(response.ok){


                const user =
                    await response.json();


                setName(user.name ?? "");

                setEmail(user.email ?? "");

                setRole(user.role ?? "engineer");

                setStaffKind(parseStaffKind(user.staffKind));

                setStagiaireUntil(
                    user.stagiaireUntil
                        ? String(user.stagiaireUntil).slice(0, 10)
                        : ""
                );

                setActive(user.active ?? true);


            } else {


                setError("Gebruiker niet gevonden");


            }


            setLoading(false);


        }


        load();


    },[id]);




    async function save(){


        setError("");

        setSaving(true);


        try {


            const response =
                await fetch(

                    `/api/users/${id}`,

                    {

                        method:"PUT",

                        headers:{
                            "Content-Type":"application/json"
                        },

                        body:JSON.stringify({

                            name,

                            email,

                            role,

                            staffKind:
                                role === "engineer"
                                    ? staffKind
                                    : "monteur",

                            stagiaireUntil:
                                role === "engineer"
                                && staffKind === "stagiaire"
                                    ? stagiaireUntil
                                    : null,

                            active,

                            // Alleen meesturen als er een nieuw wachtwoord is
                            ...(
                                password
                                ?
                                { password }
                                :
                                {}
                            )

                        })

                    }

                );


            if(response.ok){


                router.push("/users");


            } else {


                const data =
                    await response
                    .json()
                    .catch(()=>({}));


                setError(
                    data.error ??
                    "Opslaan mislukt"
                );


            }


        } finally {

            setSaving(false);

        }


    }




    if(loading){

        return (

            <main className="p-6">

                Gebruiker laden...

            </main>

        );

    }




    return (

        <main className="
            p-6
            space-y-6
            max-w-lg
        ">


            <header>

                <h1 className="
                    text-2xl
                    font-bold
                ">

                    Gebruiker wijzigen

                </h1>

            </header>




            {
                error && (

                    <p className="
                        bg-red-100
                        border
                        border-red-300
                        text-red-700
                        rounded-xl
                        p-3
                    ">

                        {error}

                    </p>

                )
            }




            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                space-y-4
            ">


                <label className="block">

                    <span className="text-sm text-gray-600">

                        Naam

                    </span>

                    <input

                        value={name}

                        onChange={(e)=>
                            setName(e.target.value)
                        }

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

                        onChange={(e)=>
                            setEmail(e.target.value)
                        }

                        type="email"

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

                        Nieuw wachtwoord

                    </span>

                    <input

                        value={password}

                        onChange={(e)=>
                            setPassword(e.target.value)
                        }

                        type="password"

                        placeholder="Laat leeg om ongewijzigd te laten"

                        className="
                            w-full
                            border
                            rounded-xl
                            p-3
                            mt-1
                        "

                    />

                    <span className="text-xs text-gray-400">

                        Vul alleen in als het wachtwoord gereset moet worden
                        (minimaal 8 tekens).

                    </span>

                </label>


                <label className="block">

                    <span className="text-sm text-gray-600">

                        Rol / functie

                    </span>

                    <select

                        value={role}

                        onChange={(e)=>
                            setRole(e.target.value)
                        }

                        className="
                            w-full
                            border
                            rounded-xl
                            p-3
                            mt-1
                            bg-white
                        "

                    >

                        <option value="admin">

                            👑 Admin

                        </option>

                        <option value="office">

                            🏢 Kantoor

                        </option>

                        <option value="engineer">

                            👷 Monteur

                        </option>

                    </select>

                </label>

                {role === "engineer" ? (
                    <>
                    <label className="block">
                        <span className="text-sm text-gray-600">
                            Type monteur
                        </span>
                        <select
                            value={staffKind}
                            onChange={(e) =>
                                setStaffKind(e.target.value as StaffKind)
                            }
                            className="
                                w-full
                                border
                                rounded-xl
                                p-3
                                mt-1
                                bg-white
                            "
                        >
                            {STAFF_KINDS.map((kind) => (
                                <option key={kind} value={kind}>
                                    {STAFF_KIND_LABELS[kind]}
                                </option>
                            ))}
                        </select>
                        <span className="block text-xs text-gray-400 mt-1">
                            Inlener en stagiair tellen niet mee in de
                            bezettingsuren op de planning.
                        </span>
                    </label>
                    {staffKind === "stagiaire" ? (
                        <label className="block">
                            <span className="text-sm text-gray-600">
                                Stage tot en met *
                            </span>
                            <input
                                type="date"
                                value={stagiaireUntil}
                                onChange={(e) =>
                                    setStagiaireUntil(e.target.value)
                                }
                                className="
                                    w-full
                                    border
                                    rounded-xl
                                    p-3
                                    mt-1
                                    bg-white
                                "
                                required
                            />
                            <span className="block text-xs text-gray-400 mt-1">
                                Tot deze datum zichtbaar en inplanbaar in de
                                planning; daarna niet meer.
                            </span>
                        </label>
                    ) : null}
                    </>
                ) : null}


                <label className="flex flex-col gap-1">

                    <span className="flex items-center gap-2">

                    <input

                        type="checkbox"

                        checked={active}

                        onChange={(e)=>
                            setActive(e.target.checked)
                        }

                    />

                    <span className="text-sm text-gray-600">

                        Actief (kan inloggen)

                    </span>

                    </span>

                    <span className="text-xs text-gray-400 pl-6">
                        Uitvinken blokkeert alleen inloggen; de persoon
                        blijft in de planning.
                    </span>

                </label>

            </section>




            <div className="
                flex
                gap-3
            ">

                <button

                    onClick={save}

                    disabled={saving}

                    className="
                        bg-black
                        text-white
                        rounded-xl
                        px-5
                        py-3
                        font-bold
                        disabled:opacity-50
                    "

                >

                    {saving ? "Bezig..." : "Opslaan"}

                </button>


                <button

                    onClick={()=>router.push("/users")}

                    className="
                        border
                        rounded-xl
                        px-5
                        py-3
                    "

                >

                    Annuleren

                </button>

            </div>


        </main>

    );

}
