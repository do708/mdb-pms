"use client";

import Link from "next/link";


interface WeekViewProps {

    items:any[];

}





export default function WeekView({

    items

}:WeekViewProps){



    const today = new Date();



    const startOfWeek = new Date(today);


    startOfWeek.setDate(
        today.getDate() - today.getDay() + 1
    );



    const days = Array.from(
        {length:5},
        (_,index)=>{

            const date = new Date(startOfWeek);

            date.setDate(
                startOfWeek.getDate() + index
            );

            return date;

        }

    );






    const users = Array.from(

        new Map(

            items

            .flatMap(
                item=>item.users
            )

            .map(
                x=>[
                    x.user.id,
                    x.user
                ]
            )

        )

        .values()

    );






    return (

        <section className="
            bg-white
            border
            rounded-2xl
            p-5
            overflow-x-auto
        ">



            <h2 className="
                text-xl
                font-bold
                mb-5
            ">

                Monteur planning

            </h2>







            <div className="
                min-w-[1100px]
            ">



                <div className="
                    grid
                    grid-cols-6
                    gap-2
                    mb-3
                ">


                    <div className="font-bold">

                        Monteur

                    </div>


                    {
                        days.map(day=>(


                            <div

                                key={day.toISOString()}

                                className="
                                    font-bold
                                    text-center
                                "

                            >

                                {
                                    day.toLocaleDateString(
                                        "nl-NL",
                                        {
                                            weekday:"short",
                                            day:"numeric"
                                        }
                                    )
                                }


                            </div>


                        ))
                    }


                </div>







                {
                    users.map(user=>(


                        <div

                            key={user.id}

                            className="
                                grid
                                grid-cols-6
                                gap-2
                                border-t
                                py-3
                            "

                        >



                            <div className="
                                font-bold
                            ">

                                👷 {user.name}

                            </div>





                            {
                                days.map(day=>(


                                    <div

                                        key={day.toISOString()}

                                        className="
                                            border
                                            rounded-xl
                                            min-h-32
                                            p-2
                                        "

                                    >



                                        {
                                            items

                                            .filter(item=>{


                                                const assigned =
                                                    item.users.some(
                                                        (x:any)=>
                                                            x.user.id
                                                            ===
                                                            user.id
                                                    );


                                                if(!assigned)
                                                    return false;



                                                if(!item.plannedDate)
                                                    return false;



                                                const date =
                                                    new Date(
                                                        item.plannedDate
                                                    );



                                                return (

                                                    date.getDate()
                                                    ===
                                                    day.getDate()

                                                    &&

                                                    date.getMonth()
                                                    ===
                                                    day.getMonth()

                                                    &&

                                                    date.getFullYear()
                                                    ===
                                                    day.getFullYear()

                                                );


                                            })


                                            .map(item=>(


                                                <Link

                                                    key={item.id}

                                                    href={`/assignments/${item.id}`}

                                                    className="
                                                        block
                                                        text-xs
                                                        text-white
                                                        rounded-lg
                                                        p-2
                                                        mb-2
                                                    "

                                                    style={{

                                                        backgroundColor:
                                                            item.customer.color

                                                    }}

                                                >

                                                    <strong>

                                                        {item.title}

                                                    </strong>


                                                    <br/>


                                                    {item.customer.name}


                                                </Link>


                                            ))

                                        }



                                    </div>


                                ))

                            }



                        </div>


                    ))

                }



            </div>



        </section>

    );

}