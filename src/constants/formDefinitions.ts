// Definities van de losse formulieren (naast de werkbon).
// Eén renderer (DynamicForm) bouwt hieruit zowel het invulformulier
// als de read-only weergave. Nieuw formulier = nieuwe definitie hier.

export type FormFieldType =
    | "kop"
    | "text"
    | "number"
    | "textarea"
    | "date"
    | "time"
    | "datetime"
    | "money"
    | "janee"
    | "keuze"
    | "foto"
    | "handtekening"
    | "monteur";

export type FormFieldWhen = {
    fieldId: string;
    equalsPrefix?: string;
    notEqualsPrefix?: string;
};

export interface FormField {

    id:string;

    type:FormFieldType;

    label:string;

    required?:boolean;

    // janee: ook een n.v.t.-optie tonen
    nvt?:boolean;

    // keuze
    options?:string[];

    // date: standaard op de datum van vandaag zetten
    defaultToday?:boolean;

    when?: FormFieldWhen;

}

export function isBlankHoursOrTimeValue(value: unknown): boolean {
    if (value === undefined || value === null) {
        return true;
    }

    if (typeof value === "number") {
        return !Number.isFinite(value);
    }

    const text = String(value).trim();

    if (!text) {
        return true;
    }

    const compact = text.replace(/\s/g, "");

    return /^[-–—.:]+$/.test(compact);
}

export function isOptionalHoursOrTimeField(field: FormField): boolean {
    return (
        field.id === "totaalUren" ||
        field.id === "vanTijd" ||
        field.id === "totTijd" ||
        field.type === "time"
    );
}

export function fieldIsVisible(
    field: FormField,
    values: Record<string, unknown> | null | undefined
): boolean {
    if (!field.when) {
        return true;
    }

    const raw = values?.[field.when.fieldId];
    const current = typeof raw === "string" ? raw.trim().toLowerCase() : "";

    if (field.when.equalsPrefix) {
        return current.startsWith(field.when.equalsPrefix.trim().toLowerCase());
    }

    if (field.when.notEqualsPrefix) {
        return !current.startsWith(
            field.when.notEqualsPrefix.trim().toLowerCase()
        );
    }

    return true;
}

/** Read-only: hide empty hours/times on a submitted aanvraag. Keep them on the fill form. */
export function fieldShowsOnSubmission(
    field: FormField,
    values: Record<string, unknown> | null | undefined
): boolean {
    if (!fieldIsVisible(field, values)) {
        return false;
    }

    if (
        isOptionalHoursOrTimeField(field) &&
        isBlankHoursOrTimeValue(values?.[field.id])
    ) {
        return false;
    }

    return true;
}



export interface FormDefinition {

    type:string;

    label:string;

    icon:string;

    description:string;

    fields:FormField[];

}




const janee = (
    id:string,
    label:string,
    nvt = true
):FormField => ({
    id,
    type:"janee",
    label,
    nvt
});




export const FORM_DEFINITIONS:FormDefinition[] = [


    // ================= Bon declareren =================
    {
        type:"declaratie",

        label:"Bon declareren",

        icon:"💶",

        description:
            "Declareer parkeerkosten, materiaal of andere bonnen",

        fields:[

            {
                id:"monteur",
                type:"monteur",
                label:"Monteur"
            },

            {
                id:"datumTijd",
                type:"datetime",
                label:"Datum / tijd",
                required:true
            },

            {
                id:"bonFoto",
                type:"foto",
                label:"Foto van de bon",
                required:true
            },

            {
                id:"reden",
                type:"text",
                label:"Reden / project",
                required:true
            },

            {
                id:"totaal",
                type:"money",
                label:"Totaal incl. BTW",
                required:true
            },

            janee(
                "voorgeschoten",
                "Heb je dit voorgeschoten?",
                false
            ),

            {
                id:"handtekening",
                type:"handtekening",
                label:"Handtekening monteur",
                required:true
            }

        ]
    },


    // ================= Verlofaanvraag =================
    {
        type:"verlof",

        label:"Verlofaanvraag",

        icon:"🌴",

        description:
            "Vraag vakantiedagen of ander verlof aan. Weekend en feestdagen tellen niet als verlofdag.",

        fields:[

            {
                id:"werknemer",
                type:"monteur",
                label:"Werknemer"
            },

            {
                id:"datumAanvraag",
                type:"date",
                label:"Datum van aanvraag",
                required:true,
                defaultToday:true
            },

            {
                id:"typeVerlof",
                type:"keuze",
                label:"Type verlof",
                required:true,
                options:[
                    "Vakantiedagen / ADV",
                    "Kort verlof",
                    "Anders..."
                ]
            },

            {
                id:"reden",
                type:"text",
                label:"Reden",
                when:{
                    fieldId:"typeVerlof",
                    notEqualsPrefix:"Vakantiedagen"
                }
            },

            {
                id:"eersteDag",
                type:"date",
                label:"Eerste verlofdag",
                required:true
            },

            {
                id:"laatsteDag",
                type:"date",
                label:"Laatste verlofdag",
                required:true
            },

            {
                id:"totaalUren",
                type:"number",
                label:"Totaal aantal uren",
                when:{
                    fieldId:"typeVerlof",
                    equalsPrefix:"Kort verlof"
                }
            },

            {
                id:"vanTijd",
                type:"time",
                label:"Van",
                when:{
                    fieldId:"typeVerlof",
                    equalsPrefix:"Kort verlof"
                }
            },

            {
                id:"totTijd",
                type:"time",
                label:"Tot",
                when:{
                    fieldId:"typeVerlof",
                    equalsPrefix:"Kort verlof"
                }
            },

            {
                id:"handtekening",
                type:"handtekening",
                label:"Handtekening medewerker",
                required:true
            }

        ]
    },


    // ================= Werkplekinspectie =================
    {
        type:"werkplekinspectie",

        label:"Werkplekinspectie",

        icon:"🦺",

        description:
            "VCA werkplekinspectie op locatie",

        fields:[

            { id:"projectnaam", type:"text", label:"Projectnaam", required:true },

            { id:"projectnummer", type:"text", label:"Projectnummer" },

            { id:"adres", type:"textarea", label:"Adres" },

            { id:"inspectieDatum", type:"date", label:"Inspectiedatum", required:true },

            { id:"inspectieBij", type:"text", label:"Inspectie bij", required:true },

            { id:"inspectieDoor", type:"text", label:"Inspectie door", required:true },


            { id:"kop1", type:"kop", label:"Organisatie & Personeel" },

            janee("vca","Heeft de medewerker zijn/haar VCA?"),

            janee("toolboxen","Heeft de medewerker alle geplande toolboxen bijgewoond?"),

            janee("communicatie","Vindt er voldoende communicatie plaats tussen de leidinggevende en de medewerker?"),

            { id:"opm1", type:"textarea", label:"Opmerkingen" },

            { id:"foto1", type:"foto", label:"Foto" },


            { id:"kop2", type:"kop", label:"Veiligheid" },

            janee("lmra","Is er een LMRA uitgevoerd?"),

            janee("pbmGebruik","Worden PBM's juist gebruikt?"),

            janee("pbmStaat","Zijn de PBM's in goede staat?"),

            janee("afzetting","Is de afzetting van de werklocatie effectief?"),

            janee("spanningsloos","Wordt er spanningsloos gewerkt?"),

            janee("brandblus","Zijn er brandblusmiddelen aanwezig?"),

            janee("brandblusKeuring","Zijn deze nog goed gekeurd?"),

            janee("ehbo","Zijn er EHBO middelen aanwezig?"),

            janee("ehboKeuring","Zijn deze nog goed gekeurd?"),

            janee("calamiteiten","Weet de medewerker hoe te handelen bij calamiteiten?"),

            janee("ongevallen","Zijn er (bijna) ongevallen geweest?"),

            janee("ongevallenGemeld","Is dit gemeld?"),

            { id:"opm2", type:"textarea", label:"Opmerkingen" },

            { id:"foto2", type:"foto", label:"Foto" },


            { id:"kop3", type:"kop", label:"Kwaliteit uitvoering" },

            janee("werkplekSchoon","Is de werkplek schoon, ordelijk en hygiënisch?"),

            janee("autoSchoon","Is de bedrijfsauto schoon, ordelijk en hygiënisch?"),

            janee("juisteMaterialen","Worden de juiste materialen/gereedschappen gebruikt volgens de voorschriften van de fabrikant?"),

            janee("schades","Zijn er schades veroorzaakt?"),

            { id:"opm3", type:"textarea", label:"Opmerkingen" },

            { id:"foto3", type:"foto", label:"Foto" },


            { id:"kop4", type:"kop", label:"Opdrachtgever & Omgeving" },

            janee("ingelicht","Is de opdrachtgever/bewoner ingelicht over de werkzaamheden?"),

            janee("routeVeilig","Is de route en toegang naar de werkplek veilig?"),

            janee("toegangVrij","Is de toegang voor omstanders vrij gehouden?"),

            janee("instructies","Kent de medewerker de klantspecifieke veiligheidsinstructies (alarmering/ontruiming)?"),

            janee("opgeruimd","Is de werkplek opgeruimd achtergelaten?"),

            janee("afvalGescheiden","Is het afval gescheiden ingezameld en afgevoerd?"),

            { id:"opm4", type:"textarea", label:"Opmerkingen" },

            { id:"foto4", type:"foto", label:"Foto" },


            { id:"kop5", type:"kop", label:"Materiaal & Middelen" },

            janee("handgereedschap","Is het handgereedschap in orde en onbeschadigd?"),

            janee("juistGereedschap","Wordt het juiste gereedschap gebruikt?"),

            janee("kabels","Zijn kabels, snoeren en haspels in orde?"),

            janee("kabelsKeuring","Zijn deze gekeurd?"),

            janee("ladders","Zijn de aanwezige ladders in orde?"),

            janee("laddersKeuring","Zijn deze gekeurd?"),

            janee("autoSchadevrij","Is de bedrijfsauto schadevrij?"),

            janee("banden","Zijn de banden van de bedrijfsauto in orde (genoeg profiel aanwezig, min. 1,6 millimeter)?"),

            { id:"opm5", type:"textarea", label:"Opmerkingen" },

            { id:"foto5", type:"foto", label:"Foto" },


            { id:"kop6", type:"kop", label:"Eindoordeel" },

            {
                id:"eindoordeel",
                type:"keuze",
                label:"Eindoordeel",
                required:true,
                options:[
                    "OK",
                    "Verbeterpunten besproken",
                    "NOK"
                ]
            },

            { id:"verbeterpunten", type:"textarea", label:"Verbeterpunten" },

            { id:"opmEind", type:"textarea", label:"Opmerkingen" },

            {
                id:"handtekening1",
                type:"handtekening",
                label:"Handtekening geïnspecteerde",
                required:true
            },

            {
                id:"handtekening2",
                type:"handtekening",
                label:"Handtekening inspecteur",
                required:true
            }

        ]
    }

];




export function getFormDefinition(
    type:string
):FormDefinition | undefined {

    return FORM_DEFINITIONS.find(
        definition=>definition.type === type
    );

}
