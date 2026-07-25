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
                text-xs
                text-white
                rounded-lg
                p-2
                mb-2
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


                <strong>
                    {item.title}
                </strong>

                <br/>

                {customer?.name ?? "Onbekende klant"}

                {
                    item.assignedUser?.name && (

                        <>
                            <br/>
                            👷 {item.assignedUser.name}
                        </>

                    )
                }


            </Link>


        </div>

    );

}
