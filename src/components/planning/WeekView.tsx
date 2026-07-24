"use client";

import Link from "next/link";



// ISO 8601 weeknummer (weken beginnen op maandag)
function isoWeek(date:Date){

    const d = new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        )
    );

    const day = d.getUTCDay() || 7;

    d.setUTCDate(
        d.getUTCDate() + 4 - day
    );

    const yearStart = new Date(
        Date.UTC(d.getUTCFullYear(),0,1)
    );

    return Math.ceil(
        (
            (d.getTime() - yearStart.getTime())
            / 86400000
            + 1
        ) / 7
    );

}



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




    // Monteurs afleiden uit de toegewezen werkbonnen
    const users = Array.from(

        new Map(

            items

            .filter(
                item=>item.assignedUser
            )

            .map(
                item=>[
                    item.assignedUser.id,
                    item.assignedUser
                ]
            )

        )
        .values()

    ) as {
        id:string;
        name:string | null;
    }[];




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

                <span className="
                    text-gray-400
                    font-normal
                    ml-3
                ">

                    Week {isoWeek(startOfWeek)}

                </span>

            </h2>




            {
                users.length === 0 && (

                    <p className="text-gray-500">

                        Geen werkbonnen met monteur ingepland deze week.

                    </p>

                )
            }




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


                                                if(
                                                    item.assignedUser?.id
                                                    !==
                                                    user.id
                                                ){
                                                    return false;
                                                }



                                                if(!item.plannedDate){
                                                    return false;
                                                }



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

                                                    href={`/workorders/${item.id}`}

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
                                                            item.project?.customer?.color
                                                            ?? "#2563eb"

                                                    }}

                                                >

                                                    <strong>

                                                        {item.title}

                                                    </strong>


                                                    <br/>


                                                    {
                                                        item.project?.customer?.name
                                                        ?? "Onbekende klant"
                                                    }


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
