"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";



// Office/admin en monteur openen dezelfde nette werkbonpagina.
// Deze pagina stuurt daarom door naar de uitvoerpagina.
export default function WorkorderDetailPage(){


    const params = useParams();

    const router = useRouter();


    const id =
        params.id as string;


    useEffect(()=>{

        if(id){
            router.replace(`/engineer/workorders/${id}`);
        }

    },[id, router]);


    return (
        <main className="p-6 text-gray-500">
            Bezig met openen...
        </main>
    );

}
