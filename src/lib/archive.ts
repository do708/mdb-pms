// Wanneer telt een afgeronde werkbon/formulier als "gearchiveerd"?
// Regel: status afgerond EN ouder dan 2 weken. Zulke items verdwijnen
// uit de gewone overzichten en zijn alleen nog via het Archief te vinden.

export const ARCHIVE_WEEKS = 2;



export function archiveCutoff():Date {

    const cutoff =
        new Date();

    cutoff.setDate(
        cutoff.getDate() - ARCHIVE_WEEKS * 7
    );

    return cutoff;

}



// Prisma-where die AFGERONDE, oude items UITSLUIT (voor de gewone lijsten).
// Niet-afgeronde items blijven altijd zichtbaar, ongeacht ouderdom.
export function excludeArchivedWorkorders(){

    return {

        NOT:{

            status:"afgerond",

            updatedAt:{
                lt:archiveCutoff()
            }

        }

    };

}



// Prisma-where die ALLEEN de gearchiveerde werkbonnen teruggeeft.
export function onlyArchivedWorkorders(){

    return {

        status:"afgerond",

        updatedAt:{
            lt:archiveCutoff()
        }

    };

}



// Formulieren: "afgerond" bestaat niet als status; we archiveren op
// ouderdom van ingediende formulieren.
export function excludeArchivedForms(){

    return {

        NOT:{

            createdAt:{
                lt:archiveCutoff()
            }

        }

    };

}



export function onlyArchivedForms(){

    return {

        createdAt:{
            lt:archiveCutoff()
        }

    };

}
