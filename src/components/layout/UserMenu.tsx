"use client";

import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";


export default function UserMenu() {


    const [open, setOpen] = useState(false);



    return (

        <div className="
            relative
        ">


            <button

                onClick={() => setOpen(!open)}

                className="
                    flex
                    items-center
                    gap-3
                    px-3
                    py-2
                    rounded-xl
                    hover:bg-gray-100
                    transition
                "

            >

                <div className="
                    h-10
                    w-10
                    rounded-full
                    bg-[#d6007e]
                    text-white
                    flex
                    items-center
                    justify-center
                    font-semibold
                ">

                    A

                </div>


                <div className="
                    text-left
                ">

                    <p className="
                        text-sm
                        font-semibold
                        text-gray-900
                    ">

                        Administrator

                    </p>


                    <p className="
                        text-xs
                        text-gray-500
                    ">

                        Admin

                    </p>


                </div>


            </button>





            {open && (

                <div className="
                    absolute
                    right-0
                    mt-3
                    w-48
                    bg-white
                    border
                    border-gray-200
                    rounded-xl
                    shadow-lg
                    p-3
                    z-50
                ">


                    <button

                        onClick={() => signOut({
                            callbackUrl: "/login"
                        })}

                        className="
                            w-full
                            flex
                            items-center
                            gap-2
                            px-4
                            py-2
                            rounded-xl
                            bg-yellow-100/70
                            text-yellow-700
                            font-medium
                            text-sm
                            hover:bg-yellow-200
                            transition
                        "

                    >

                        <LogOut size={18}/>

                        Uitloggen


                    </button>


                </div>

            )}


        </div>

    );

}