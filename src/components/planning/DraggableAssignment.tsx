"use client";

import Link from "next/link";



interface Props {

    item:any;

    draggable?:boolean;

}



export default function DraggableAssignment({

    item,

    draggable = false

}:Props){



    // De planning-API levert werkbonnen: de klant hangt onder project.
    const customer =
        item.customer
        ??
        item.project?.customer;



    function handleDragStart(
        event:React.DragEvent
    ){

        event.dataTransfer.setData(
            "workorderId",
            item.id
        );

    }



    return (

        <div

            draggable={draggable}

            onDragStart={
                draggable
                ?
                handleDragStart
                :
                undefined
            }

            className={`
                text-white
                rounded-md
                px-1.5
                py-1
                mb-1
                leading-tight
                ${
                    draggable
                    ?
                    "cursor-move"
                    :
                    ""
                }
            `}

            style={{
                backgroundColor:
                    customer?.color ?? "#2563eb"
            }}

        >


            <Link

                href={`/workorders/${item.id}`}

                className="
                    block
                "

                draggable={false}

            >


                <span className="text-[11px] font-bold block truncate">

                    👷 {item.assignedUser?.name ?? "Geen monteur"}

                </span>


                <span className="text-[11px] block truncate">

                    🏢 {customer?.name ?? "Onbekende klant"}

                </span>


                <span className="text-[10px] block truncate opacity-90">

                    {item.title}

                </span>


            </Link>


        </div>

    );

}
