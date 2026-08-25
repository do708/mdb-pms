// De statusflow van een werkbon, precies zoals MDB werkt.
// Eén bron van waarheid: labels, kleuren en volgorde staan hier.

export interface WorkorderStatus {

    key:string;

    label:string;

    // Tailwind-klassen voor de badge
    badge:string;

    // Vanaf welke status hoort de werkbon in de planning
    inPlanning?:boolean;

    /** Buiten de lineaire stappenbalk (rechts uitgelijnd), bv. On Hold */
    sideStatus?:boolean;

}



/** Lineaire flow + side-statussen (On Hold). */
export const WORKORDER_STATUSES:WorkorderStatus[] = [

    {
        key:"ontvangen",
        label:"Opdracht ontvangen",
        badge:"bg-green-100 text-green-700"
    },

    {
        key:"afspraak",
        label:"Afspraak verstuurd",
        badge:"bg-teal-100 text-teal-700"
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
        badge:"bg-purple-100 text-purple-700",
        inPlanning:true
    },

    {
        key:"on_hold",
        label:"On Hold",
        badge:"bg-amber-100 text-amber-800",
        inPlanning:true,
        sideStatus:true
    }

];



/** Alleen de genummerde stappen (1–5), zonder On Hold. */
export const WORKORDER_FLOW_STATUSES =
    WORKORDER_STATUSES.filter(s=>!s.sideStatus);



/** Actieve opdrachten (niet in archief). Gefactureerd valt onder Archief. */
export const WORKORDER_ACTIVE_STATUSES =
    WORKORDER_STATUSES.filter(s=>s.key !== "gefactureerd");



export const WORKORDER_STATUS_KEYS =
    WORKORDER_STATUSES.map(
        status=>status.key
    );


export const WORKORDER_ACTIVE_STATUS_KEYS =
    WORKORDER_ACTIVE_STATUSES.map(
        status=>status.key
    );



/** Monteur-Opdrachten: alleen ingepland (plus legacy-waarde). */
export const ENGINEER_OPDRACHT_STATUS_KEYS = [
    "ingepland",
    "in_uitvoering",
] as const;

/** PDF en foto-ZIP bestaan pas als de monteur de opdracht heeft afgerond. */
export function heeftUitgevoerdeWerkbon(
    key: string | null | undefined
): boolean {
    const status = migrateStatus(key);
    return status === "uitgevoerd" || status === "gefactureerd";
}



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



// Oude statuswaarden -> nieuwe, voor bestaande opdrachten.
export function migrateStatus(
    key:string | null | undefined
):string {

    const map:Record<string,string> = {
        open:"ontvangen",
        in_uitvoering:"ingepland",
        materiaal:"ingepland",
        betaald:"gefactureerd",
        afgerond:"gefactureerd"
    };

    if(!key){
        return "ontvangen";
    }

    return map[key] ?? key;

}
