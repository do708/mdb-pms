import { PDFDocument, rgb, StandardFonts } from "pdf-lib";



interface WorkorderPdfData {

    number:string;

    title:string;

    description?:string | null;

    customer:string;

    address?:string | null;

    project:string;

    hours?:number;

}





export async function generateWorkorderPdf(

    data:WorkorderPdfData

){


    const pdfDoc =
        await PDFDocument.create();




    const page =
        pdfDoc.addPage([595,842]);



    const font =
        await pdfDoc.embedFont(
            StandardFonts.Helvetica
        );





    let y = 800;





    function write(

        text:string,

        size=12

    ){


        page.drawText(

            text,

            {

                x:50,

                y,

                size,

                font,

                color:rgb(
                    0,
                    0,
                    0
                )

            }

        );


        y -= size + 10;


    }







    write(

        "MDB Networks",

        20

    );



    write(

        "Werkbon",

        16

    );



    y -= 10;




    write(

        `Nummer: ${data.number}`

    );


    write(

        `Project: ${data.project}`

    );


    write(

        `Klant: ${data.customer}`

    );



    write(

        `Adres: ${data.address || "-"}`

    );




    y -= 20;



    write(

        "Werkzaamheden",

        14

    );



    write(

        data.description || "-"

    );





    y -= 20;



    write(

        "Uren",

        14

    );


    write(

        `${data.hours || 0} uur`

    );













    const pdfBytes =
        await pdfDoc.save();





    return pdfBytes;


}