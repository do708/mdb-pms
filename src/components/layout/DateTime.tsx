"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";


export default function DateTime() {


    // Start als null zodat server en client hetzelfde renderen (geen tijd).
    // De klok wordt pas na het mounten (client-side) gevuld.
    const [date, setDate] = useState<Date | null>(null);


    useEffect(() => {

        setDate(new Date());

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

                    {
                        date
                        ?
                        date.toLocaleTimeString(
                            "nl-NL",
                            {
                                hour: "2-digit",
                                minute: "2-digit",
                            }
                        )
                        :
                        "--:--"
                    }

                </p>



                <p className="
                    text-xs
                    text-gray-500
                ">

                    {
                        date
                        ?
                        date.toLocaleDateString(
                            "nl-NL",
                            {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            }
                        )
                        :
                        ""
                    }

                </p>


            </div>


        </div>

    );

}