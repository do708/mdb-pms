"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";



export default function NewCustomerPage(){


    const router = useRouter();



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

    const [saving,setSaving] =
        useState(false);







    async function createCustomer(){


        if(!name){

            alert(
                "Vul een klantnaam in"
            );

            return;

        }



        setSaving(true);



        try{


            const response =
                await fetch(

                    "/api/customers",

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:JSON.stringify({

                            name,

                            email,

                            phone,

                            address,

                            color

                        })

                    }

                );





            if(response.ok){


                router.push(
                    "/customers"
                );


            } else {


                alert(
                    "Klant aanmaken mislukt"
                );


            }



        } catch(error){


            console.error(
                error
            );


            alert(
                "Er ging iets fout"
            );


        } finally {


            setSaving(false);


        }


    }








    return (

        <main className="
            p-6
            space-y-6
        ">


            <header>


                <h1 className="
                    text-2xl
                    font-bold
                ">

                    Nieuwe klant

                </h1>


                <p className="
                    text-gray-500
                ">

                    Klant toevoegen aan MDB PMS

                </p>


            </header>








            <section className="
                bg-white
                border
                rounded-2xl
                p-6
                space-y-4
            ">


                <input

                    value={name}

                    onChange={(e)=>
                        setName(
                            e.target.value
                        )
                    }

                    placeholder="Bedrijfsnaam"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />





                <input

                    value={email}

                    onChange={(e)=>
                        setEmail(
                            e.target.value
                        )
                    }

                    placeholder="E-mail"

                    type="email"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />





                <input

                    value={phone}

                    onChange={(e)=>
                        setPhone(
                            e.target.value
                        )
                    }

                    placeholder="Telefoon"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />





                <textarea

                    value={address}

                    onChange={(e)=>
                        setAddress(
                            e.target.value
                        )
                    }

                    placeholder="Adres"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                        min-h-24
                    "

                />


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



                <button

                    type="button"

                    onClick={createCustomer}

                    disabled={saving}

                    className="
                        w-full
                        bg-[#d6007e]
                        text-white
                        rounded-xl
                        py-4
                        font-bold
                    "

                >

                    {
                        saving
                        ?
                        "Opslaan..."
                        :
                        "➕ Klant opslaan"
                    }


                </button>



            </section>



        </main>

    );

}