// De statusflow van een werkbon, precies zoals MDB werkt.
// Eén bron van waarheid: labels, kleuren en volgorde staan hier.

export interface WorkorderStatus {

    key:string;

    label:string;

    // Tailwind-klassen voor de badge
    badge:string;

    // Vanaf welke status hoort de werkbon in de planning
    inPlanning?:boolean;

}



export const WORKORDER_STATUSES:WorkorderStatus[] = [

    {
        key:"ontvangen",
        label:"Opdracht ontvangen",
        badge:"bg-green-100 text-green-700"
    },

    {
        key:"afspraak",
        label:"Afspraak gemaakt",
        badge:"bg-teal-100 text-teal-700"
    },

    {
        key:"materiaal",
        label:"Materiaal besteld/ontvangen",
        badge:"bg-amber-100 text-amber-700"
    },

    {
        key:"ingepland",
        label:"Ingepland",
        badge:"bg-blue-100 text-blue-700",
        inPlanning:true
    },

    {
        key:"uitgevoerd",
        label:"Uitgevoerd",
        badge:"bg-indigo-100 text-indigo-700",
        inPlanning:true
    },

    {
        key:"gefactureerd",
        label:"Gefactureerd",
        badge:"bg-purple-100 text-purple-700"
    },

    {
        key:"betaald",
        label:"Betaald",
        badge:"bg-fuchsia-100 text-fuchsia-700"
    },

    {
        key:"afgerond",
        label:"Afgerond",
        badge:"bg-gray-200 text-gray-700"
    }

];



export const WORKORDER_STATUS_KEYS =
    WORKORDER_STATUSES.map(
        status=>status.key
    );



export function getStatus(
    key:string
):WorkorderStatus {

    return (
        WORKORDER_STATUSES.find(
            status=>status.key === key
        )
        ??
        // Fallback voor onbekende/oude waarden
        {
            key,
            label:key,
            badge:"bg-gray-100 text-gray-600"
        }
    );

}



// Vanaf welke status verschijnt de werkbon in de planning?
export function isInPlanning(
    key:string
):boolean {

    return Boolean(
        getStatus(key).inPlanning
    );

}



// Oude statuswaarden -> nieuwe, voor bestaande werkbonnen.
export function migrateStatus(
    key:string | null | undefined
):string {

    const map:Record<string,string> = {
        open:"ontvangen",
        in_uitvoering:"ingepland",
        afgerond:"afgerond"
    };

    if(!key){
        return "ontvangen";
    }

    return map[key] ?? key;

}
