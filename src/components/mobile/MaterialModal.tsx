"use client";

import { useState } from "react";
import {
    X,
    Plus,
    Package
} from "lucide-react";


export interface MaterialItem {

    name: string;

    articleNumber: string;

    quantity: string;

    unit: string;

    note: string;

}



interface MaterialModalProps {

    open: boolean;

    onClose: () => void;

    onAdd: (material: MaterialItem) => void;

}



export default function MaterialModal({

    open,

    onClose,

    onAdd,

}: MaterialModalProps) {


    const [material, setMaterial] = useState<MaterialItem>({

        name: "",

        articleNumber: "",

        quantity: "",

        unit: "stuks",

        note: "",

    });




    if (!open) return null;




    function updateField(

        field:keyof MaterialItem,

        value:string

    ) {


        setMaterial({

            ...material,

            [field]: value,

        });


    }




    function submit() {


        if (!material.name) return;


        onAdd(material);


        setMaterial({

            name:"",

            articleNumber:"",

            quantity:"",

            unit:"stuks",

            note:"",

        });


        onClose();


    }





    return (

        <div className="
            fixed
            inset-0
            bg-black/40
            flex
            items-end
            justify-center
            z-50
        ">


            <div className="
                bg-white
                w-full
                rounded-t-3xl
                p-6
                space-y-5
            ">


                {/* Titel */}

                <div className="
                    flex
                    justify-between
                    items-center
                ">


                    <div className="
                        flex
                        items-center
                        gap-2
                    ">


                        <Package

                            size={22}

                            className="
                                text-[#12345b]
                            "

                        />


                        <h2 className="
                            text-lg
                            font-bold
                        ">

                            Materiaal toevoegen

                        </h2>


                    </div>



                    <button

                        onClick={onClose}

                        className="
                            p-2
                            rounded-full
                            bg-gray-100
                        "

                    >

                        <X size={20}/>

                    </button>


                </div>





                {/* Velden */}

                <input

                    placeholder="Materiaal"

                    value={material.name}

                    onChange={(e)=>
                        updateField(
                            "name",
                            e.target.value
                        )
                    }

                    className="
                        w-full
                        rounded-xl
                        border
                        p-3
                        text-sm
                    "

                />



                <input

                    placeholder="Artikelnummer"

                    value={material.articleNumber}

                    onChange={(e)=>
                        updateField(
                            "articleNumber",
                            e.target.value
                        )
                    }

                    className="
                        w-full
                        rounded-xl
                        border
                        p-3
                        text-sm
                    "

                />





                <div className="
                    grid
                    grid-cols-2
                    gap-3
                ">


                    <input

                        placeholder="Aantal"

                        value={material.quantity}

                        onChange={(e)=>
                            updateField(
                                "quantity",
                                e.target.value
                            )
                        }

                        className="
                            rounded-xl
                            border
                            p-3
                            text-sm
                        "

                    />



                    <select

                        value={material.unit}

                        onChange={(e)=>
                            updateField(
                                "unit",
                                e.target.value
                            )
                        }

                        className="
                            rounded-xl
                            border
                            p-3
                            text-sm
                        "

                    >

                        <option>
                            stuks
                        </option>

                        <option>
                            meter
                        </option>

                        <option>
                            doos
                        </option>

                        <option>
                            set
                        </option>


                    </select>


                </div>





                <textarea

                    placeholder="Notitie"

                    value={material.note}

                    onChange={(e)=>
                        updateField(
                            "note",
                            e.target.value
                        )
                    }

                    className="
                        w-full
                        rounded-xl
                        border
                        p-3
                        text-sm
                        min-h-[90px]
                    "

                />





                {/* Actie */}

                <button

                    onClick={submit}

                    className="
                        w-full
                        flex
                        justify-center
                        items-center
                        gap-2
                        py-4
                        rounded-xl
                        bg-[#12345b]
                        text-white
                        font-semibold
                    "

                >

                    <Plus size={20}/>

                    Toevoegen


                </button>


            </div>


        </div>

    );

}