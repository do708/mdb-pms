"use client";

import { useState } from "react";
import {
    X,
    Plus,
    Monitor,
} from "lucide-react";


export interface HardwareItem {

    name: string;

    brand: string;

    model: string;

    serialNumber: string;

    quantity: string;

    location: string;

    status: string;

}



interface HardwareModalProps {

    open: boolean;

    onClose: () => void;

    onAdd: (hardware: HardwareItem) => void;

}



export default function HardwareModal({

    open,

    onClose,

    onAdd,

}: HardwareModalProps) {


    const [hardware, setHardware] = useState<HardwareItem>({

        name: "",

        brand: "",

        model: "",

        serialNumber: "",

        quantity: "1",

        location: "",

        status: "installed",

    });





    if (!open) return null;





    function updateField(

        field: keyof HardwareItem,

        value: string

    ) {


        setHardware({

            ...hardware,

            [field]: value,

        });


    }





    function submit() {


        if (!hardware.name) return;


        onAdd(hardware);



        setHardware({

            name:"",

            brand:"",

            model:"",

            serialNumber:"",

            quantity:"1",

            location:"",

            status:"installed",

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


                {/* Header */}

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


                        <Monitor

                            size={22}

                            className="
                                text-[#12345b]
                            "

                        />


                        <h2 className="
                            text-lg
                            font-bold
                        ">

                            Hardware toevoegen

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

                    placeholder="Naam"

                    value={hardware.name}

                    onChange={(e)=>
                        updateField(
                            "name",
                            e.target.value
                        )
                    }

                    className="
                        w-full
                        border
                        rounded-xl
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

                        placeholder="Merk"

                        value={hardware.brand}

                        onChange={(e)=>
                            updateField(
                                "brand",
                                e.target.value
                            )
                        }

                        className="
                            border
                            rounded-xl
                            p-3
                            text-sm
                        "

                    />



                    <input

                        placeholder="Model"

                        value={hardware.model}

                        onChange={(e)=>
                            updateField(
                                "model",
                                e.target.value
                            )
                        }

                        className="
                            border
                            rounded-xl
                            p-3
                            text-sm
                        "

                    />


                </div>





                <input

                    placeholder="Serienummer"

                    value={hardware.serialNumber}

                    onChange={(e)=>
                        updateField(
                            "serialNumber",
                            e.target.value
                        )
                    }

                    className="
                        w-full
                        border
                        rounded-xl
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

                        value={hardware.quantity}

                        onChange={(e)=>
                            updateField(
                                "quantity",
                                e.target.value
                            )
                        }

                        className="
                            border
                            rounded-xl
                            p-3
                            text-sm
                        "

                    />



                    <input

                        placeholder="Locatie"

                        value={hardware.location}

                        onChange={(e)=>
                            updateField(
                                "location",
                                e.target.value
                            )
                        }

                        className="
                            border
                            rounded-xl
                            p-3
                            text-sm
                        "

                    />


                </div>





                {/* Status */}

                <div>

                    <p className="
                        text-sm
                        font-medium
                        mb-2
                    ">

                        Status

                    </p>


                    <div className="
                        grid
                        grid-cols-2
                        gap-3
                    ">


                        <button

                            type="button"

                            onClick={()=>
                                updateField(
                                    "status",
                                    "installed"
                                )
                            }

                            className={`
                                py-3
                                rounded-xl
                                text-sm
                                font-medium
                                ${
                                    hardware.status === "installed"

                                    ?

                                    "bg-green-100 text-green-700"

                                    :

                                    "bg-gray-100"

                                }
                            `}

                        >

                            Geïnstalleerd

                        </button>




                        <button

                            type="button"

                            onClick={()=>
                                updateField(
                                    "status",
                                    "replaced"
                                )
                            }

                            className={`
                                py-3
                                rounded-xl
                                text-sm
                                font-medium
                                ${
                                    hardware.status === "replaced"

                                    ?

                                    "bg-orange-100 text-orange-700"

                                    :

                                    "bg-gray-100"

                                }
                            `}

                        >

                            Vervangen

                        </button>


                    </div>


                </div>





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