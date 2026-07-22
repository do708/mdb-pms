import { PDFDocument, rgb, StandardFonts } from "pdf-lib";



export async function generateWorkorderPdf(workorder:any) {


    const pdfDoc = await PDFDocument.create();



    const page = pdfDoc.addPage([595,842]);


    const font =
        await pdfDoc.embedFont(
            StandardFonts.Helvetica
        );


    const bold =
        await pdfDoc.embedFont(
            StandardFonts.HelveticaBold
        );




    let y = 800;



    function text(

        value:string,

        size = 12,

        useBold = false

    ){

        page.drawText(

            value || "",

            {

                x:50,

                y,

                size,

                font:
                    useBold
                    ? bold
                    : font,

                color:rgb(
                    0,
                    0,
                    0
                )

            }

        );


        y -= size + 10;

    }





    text(
        "MDB Networks - Werkbon",
        18,
        true
    );


    text(
        `Werkbonnummer: ${workorder.number ?? ""}`
    );


    text(
        `Datum: ${
            workorder.workDate
            ? new Date(workorder.workDate).toLocaleDateString("nl-NL")
            : ""
        }`
    );



    y -= 10;



    text(
        "Project",
        14,
        true
    );


    text(
        workorder.project?.name ?? ""
    );


    text(
        `Klant: ${
            workorder.project?.customer?.name ?? ""
        }`
    );



    y -= 10;



    text(
        "Werkzaamheden",
        14,
        true
    );


    text(
        workorder.description ?? ""
    );



    y -= 10;



    text(
        "Uren",
        14,
        true
    );


    for(
        const hour of workorder.hours ?? []
    ){

        text(
            `${hour.date ? new Date(hour.date).toLocaleDateString("nl-NL") : ""} - ${hour.hours ?? 0} uur`
        );

    }



    y -= 10;



    text(
        "Materialen",
        14,
        true
    );


    for(
        const item of workorder.materials ?? []
    ){

        text(
            `${item.quantity ?? 1}x ${item.name}`
        );

    }




    y -= 10;



    text(
        "Hardware",
        14,
        true
    );


    for(
        const item of workorder.hardware ?? []
    ){

        text(
            `${item.name} ${item.brand ?? ""} ${item.model ?? ""}`
        );

    }





    y -= 10;



    text(
        "Foto's",
        14,
        true
    );


    text(
        `${workorder.photos?.length ?? 0} foto's toegevoegd`
    );




    y -= 10;



    text(
        "Klant handtekening",
        14,
        true
    );


    text(
        workorder.signature
        ? "Ondertekend"
        : "Geen handtekening"
    );






    return await pdfDoc.save();


}