"use client";

import { useState } from "react";



interface MaterialsFormProps {

    workorderId:string;

}




interface Material {

    name:string;

    articleNumber:string;

    quantity:string;

    unit:string;

    note:string;

}






export default function MaterialsForm({

    workorderId

}:MaterialsFormProps){



    const [materials,setMaterials] =
        useState<Material[]>([]);



    const [name,setName] =
        useState("");



    const [articleNumber,setArticleNumber] =
        useState("");



    const [quantity,setQuantity] =
        useState("1");



    const [unit,setUnit] =
        useState("st");



    const [note,setNote] =
        useState("");



    const [saving,setSaving] =
        useState(false);








    function addMaterial(){


        if(!name){

            alert(
                "Vul een materiaalnaam in"
            );

            return;

        }



        setMaterials([

            ...materials,

            {

                name,

                articleNumber,

                quantity,

                unit,

                note

            }

        ]);



        setName("");

        setArticleNumber("");

        setQuantity("1");

        setUnit("st");

        setNote("");

    }







    async function saveMaterials(){


        setSaving(true);



        try {


            const response =
                await fetch(

                    `/api/workorders/${workorderId}`,

                    {

                        method:"PUT",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:JSON.stringify({

                            materials

                        })

                    }

                );





            if(response.ok){


                alert(
                    "Materialen opgeslagen"
                );


            } else {


                alert(
                    "Opslaan materialen mislukt"
                );


            }



        } catch(error){


            console.error(error);


            alert(
                "Fout bij opslaan materialen"
            );


        } finally {


            setSaving(false);


        }


    }








    return (

        <section className="
            bg-white
            border
            rounded-2xl
            p-5
            space-y-4
        ">


            <h2 className="
                font-bold
                text-lg
            ">

                📦 Materialen

            </h2>





            <input

                placeholder="Materiaal naam"

                value={name}

                onChange={(e)=>
                    setName(
                        e.target.value
                    )
                }


                className="
                    w-full
                    border
                    rounded-xl
                    p-3
                "

            />





            <input

                placeholder="Artikelnummer"

                value={articleNumber}

                onChange={(e)=>
                    setArticleNumber(
                        e.target.value
                    )
                }


                className="
                    w-full
                    border
                    rounded-xl
                    p-3
                "

            />





            <input

                type="number"

                placeholder="Aantal"

                value={quantity}

                onChange={(e)=>
                    setQuantity(
                        e.target.value
                    )
                }


                className="
                    w-full
                    border
                    rounded-xl
                    p-3
                "

            />





            <input

                placeholder="Eenheid"

                value={unit}

                onChange={(e)=>
                    setUnit(
                        e.target.value
                    )
                }


                className="
                    w-full
                    border
                    rounded-xl
                    p-3
                "

            />





            <textarea

                placeholder="Notitie"

                value={note}

                onChange={(e)=>
                    setNote(
                        e.target.value
                    )
                }


                className="
                    w-full
                    border
                    rounded-xl
                    p-3
                "

            />






            <button

                onClick={addMaterial}

                className="
                    w-full
                    border
                    rounded-xl
                    py-3
                    font-bold
                "

            >

                ➕ Materiaal toevoegen

            </button>







            {
                materials.map((material,index)=>(


                    <div

                        key={index}

                        className="
                            bg-gray-50
                            rounded-xl
                            p-3
                        "

                    >

                        <strong>

                            {material.name}

                        </strong>


                        <p>

                            {material.quantity}
                            {" "}
                            {material.unit}

                        </p>


                    </div>


                ))

            }








            <button

                onClick={saveMaterials}

                disabled={saving}

                className="
                    w-full
                    bg-blue-600
                    text-white
                    rounded-xl
                    py-3
                    font-bold
                "

            >

                {
                    saving
                    ?
                    "Opslaan..."
                    :
                    "📦 Materialen opslaan"
                }


            </button>




        </section>

    );


}