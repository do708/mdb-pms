// Controle op het "klaargezet materiaal"-blok van een werkbon.
//
// Regel: per soort (Schermen, Players, Beugels) geldt dat als het
// aantal/omschrijving-tekstvak is ingevuld, "Geleverd" én "Klaargezet" moeten
// zijn aangevinkt. Is het tekstvak leeg, dan is die soort n.v.t. en hoeft er
// niets aangevinkt te worden.
//
// De klus is "compleet gecontroleerd" als alle ingevulde soorten in orde zijn.


interface KlaarzetMateriaal {
    schermenAantal?:string;
    schermenGeleverd?:boolean;
    schermenKlaargezet?:boolean;
    playersAantal?:string;
    playersGeleverd?:boolean;
    playersKlaargezet?:boolean;
    beugelsAantal?:string;
    beugelsGeleverd?:boolean;
    beugelsKlaargezet?:boolean;
}


function regelInOrde(
    aantal:string | undefined,
    geleverd:boolean | undefined,
    klaargezet:boolean | undefined
):boolean {

    const ingevuld =
        typeof aantal === "string" && aantal.trim() !== "";

    // Leeg tekstvak => n.v.t. => in orde.
    if(!ingevuld){
        return true;
    }

    // Ingevuld => beide vinkjes verplicht.
    return Boolean(geleverd) && Boolean(klaargezet);

}


// Haalt het materiaal-blok veilig uit de (onbekende) formData van een werkbon.
export function leesKlaarzetMateriaal(
    formData:unknown
):KlaarzetMateriaal | null {

    if(
        !formData ||
        typeof formData !== "object"
    ){
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const km = (formData as any).klaarzetMateriaal;

    if(
        !km ||
        typeof km !== "object"
    ){
        return null;
    }

    return km as KlaarzetMateriaal;

}


// Is er minstens één soort ingevuld? (Anders valt er niets te controleren.)
export function heeftMateriaal(
    km:KlaarzetMateriaal | null
):boolean {

    if(!km){
        return false;
    }

    return Boolean(
        (km.schermenAantal && km.schermenAantal.trim()) ||
        (km.playersAantal && km.playersAantal.trim()) ||
        (km.beugelsAantal && km.beugelsAantal.trim())
    );

}


// Is het materiaal-blok compleet (alle ingevulde soorten geleverd+klaargezet)?
export function materiaalCompleet(
    km:KlaarzetMateriaal | null
):boolean {

    if(!km){
        // Niets ingevuld => niets te controleren => geen waarschuwing.
        return true;
    }

    return (
        regelInOrde(km.schermenAantal, km.schermenGeleverd, km.schermenKlaargezet) &&
        regelInOrde(km.playersAantal, km.playersGeleverd, km.playersKlaargezet) &&
        regelInOrde(km.beugelsAantal, km.beugelsGeleverd, km.beugelsKlaargezet)
    );

}
