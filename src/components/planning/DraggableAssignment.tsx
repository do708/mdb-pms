"use client";


interface Props {

    item:any;

    onDropDate:(id:string,date:string)=>void;

}



export default function DraggableAssignment({

    item,

    onDropDate

}:Props){





    function handleDragStart(

        event:React.DragEvent

    ){


        event.dataTransfer.setData(

            "assignmentId",

            item.id

        );


    }







    return (

        <div

            draggable

            onDragStart={handleDragStart}

            className="
                cursor-move
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


        </div>

    );

}