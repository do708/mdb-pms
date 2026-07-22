"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";


export default function DateTime() {


    const [date, setDate] = useState(new Date());


    useEffect(() => {


        const timer = setInterval(() => {

            setDate(new Date());

        }, 1000);



        return () => clearInterval(timer);


    }, []);





    return (

        <div className="
            flex
            items-center
            gap-3
            text-sm
        ">


            <Clock3

                size={20}

                className="
                    text-[#12345b]
                "

            />



            <div className="
                leading-tight
            ">


                <p className="
                    font-semibold
                    text-gray-900
                ">

                    {date.toLocaleTimeString(
                        "nl-NL",
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                        }
                    )}

                </p>



                <p className="
                    text-xs
                    text-gray-500
                ">

                    {date.toLocaleDateString(
                        "nl-NL",
                        {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        }
                    )}

                </p>


            </div>


        </div>

    );

}