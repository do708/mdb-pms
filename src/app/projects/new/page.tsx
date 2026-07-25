"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


interface Customer {

    id:string;

    name:string;

}




export default function NewProjectPage(){


    const router = useRouter();



    const [customers,setCustomers] =
        useState<Customer[]>([]);



    const [customerId,setCustomerId] =
        useState("");



    const [name,setName] =
        useState("");



    const [saving,setSaving] =
        useState(false);







    useEffect(()=>{


        async function loadCustomers(){


            const response =
                await fetch(
                    "/api/customers"
                );


            const data =
                await response.json();



            setCustomers(
                data
            );


        }



        loadCustomers();


    },[]);







    async function createProject(){


        if(!name || !customerId){


            alert(
                "Vul projectnaam en klant in"
            );

            return;


        }



        setSaving(true);




        try{


            const response =
                await fetch(

                    "/api/projects",

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:JSON.stringify({

                            name,

                            customerId

                        })

                    }

                );





            if(response.ok){


                router.push(
                    "/projects"
                );


            } else {


                alert(
                    "Project aanmaken mislukt"
                );


            }




        }catch(error){


            console.error(error);


            alert(
                "Er ging iets fout"
            );


        }finally{


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

                    Nieuw project

                </h1>


                <p className="
                    text-gray-500
                ">

                    Project toevoegen aan MDB Project Management Systeem

                </p>


            </header>







            <section className="
                bg-white
                border
                rounded-2xl
                p-6
                space-y-4
            ">



                <select

                    value={customerId}

                    onChange={(e)=>
                        setCustomerId(
                            e.target.value
                        )
                    }


                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                >

                    <option value="">

                        Kies klant

                    </option>


                    {
                        customers.map(customer=>(

                            <option

                                key={customer.id}

                                value={customer.id}

                            >

                                {customer.name}

                            </option>


                        ))
                    }


                </select>






                <input

                    value={name}

                    onChange={(e)=>
                        setName(
                            e.target.value
                        )
                    }


                    placeholder="Projectnaam"


                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />







                <button

                    onClick={createProject}

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
                        "➕ Project opslaan"
                    }


                </button>



            </section>



        </main>

    );

}