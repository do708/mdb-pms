// Helper om de opdrachtgever van een werkbon te bepalen, ongeacht of
// die er direct aan hangt (nieuwe situatie) of via een project
// (oude werkbonnen). Zo blijft alle bestaande data werken.

interface CustomerLike {

    name:string;

    address?:string | null;

    phone?:string | null;

    email?:string | null;

}



interface WorkorderLike {

    location?:string | null;

    customer?:CustomerLike | null;

    project?:{

        name?:string;

        customer?:CustomerLike | null;

    } | null;

}



export function resolveCustomer(
    workorder:WorkorderLike
):CustomerLike | null {

    return (
        workorder.customer
        ??
        workorder.project?.customer
        ??
        null
    );

}



export function customerName(
    workorder:WorkorderLike
):string {

    return (
        resolveCustomer(workorder)?.name
        ??
        "Onbekende opdrachtgever"
    );

}



// "Waar": eigen locatieveld van de werkbon, anders het klantadres.
export function workorderLocation(
    workorder:WorkorderLike
):string | null {

    return (
        workorder.location
        ??
        resolveCustomer(workorder)?.address
        ??
        null
    );

}
