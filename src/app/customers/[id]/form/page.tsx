"use client";

import { useEffect, useState, use } from "react";

import { useRouter } from "next/navigation";

import { CustomerFormSchema, parseCustomerSchema } from "@/types/customerForms";

import FormSchemaEditor from "@/components/customers/FormSchemaEditor";



export default function CustomerFormPage({
    params
}:{
    params:Promise<{ id:string }>;
}){


    const { id } = use(params);

    const router = useRouter();


    const [name,setName] =
        useState("");


    const [schema,setSchema] =
        useState<CustomerFormSchema>({ sections:[] });


    const [loading,setLoading] =
        useState(true);


    const [saving,setSaving] =
        useState(false);


    const [message,setMessage] =
        useState("");




    useEffect(()=>{

        async function load(){

            const response =
                await fetch(`/api/customers/${id}`);

            if(response.ok){

                const c = await response.json();

                setName(c.name ?? "");

                const parsed = parseCustomerSchema(c.formSchema);

                setSchema(parsed ?? { sections:[] });

            }

            setLoading(false);

        }

        load();

    },[id]);




    async function save(){

        setSaving(true);
        setMessage("");

        const response =
            await fetch(`/api/customers/${id}`,{
                method:"PUT",
                headers:{ "Content-Type":"application/json" },
                body:JSON.stringify({ formSchema:schema })
            });

        setSaving(false);

        if(response.ok){
            setMessage("Opgeslagen");
        } else {
            setMessage("Opslaan mislukt");
        }

    }




    if(loading){
        return (
            <main className="p-8">
                <p className="text-gray-500">Laden...</p>
            </main>
        );
    }




    return (

        <main className="p-8 max-w-3xl mx-auto space-y-6">

            <div>

                <button
                    onClick={()=>router.push(`/customers/${id}/edit`)}
                    className="text-sm text-blue-600 hover:underline mb-2"
                >
                    ← Terug naar klant
                </button>

                <h1 className="text-2xl font-bold">
                    Werkbon-vragen — {name}
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                    Deze vragen verschijnen bovenaan de werkbon voor deze
                    opdrachtgever.
                </p>

            </div>


            <FormSchemaEditor
                schema={schema}
                onChange={setSchema}
            />


            <div className="
                flex
                items-center
                gap-4
                border-t
                pt-5
            ">

                <button
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
                    {saving ? "Opslaan..." : "Vragen opslaan"}
                </button>

                {
                    message && (
                        <span className={
                            message.includes("mislukt")
                            ?
                            "text-red-600 text-sm"
                            :
                            "text-green-600 text-sm"
                        }>
                            {message}
                        </span>
                    )
                }

            </div>

        </main>

    );

}
