// Per-opdrachtgever formulieren: elke klant kan zijn eigen set vragen hebben
// die bovenop het standaard opleverformulier getoond worden.
//
// Overgenomen uit het oudere MDB Platform, vertaald naar onze eigen opzet.

export type FormFieldType =
    | "text"
    | "number"
    | "select"
    | "checkbox"
    | "textarea"
    | "date"
    | "email"
    | "phone";


export interface FormField {
    id:string;
    label:string;
    type:FormFieldType;
    required?:boolean;
    options?:string[];
    placeholder?:string;
    helpText?:string;
}


export interface FormSection {
    id:string;
    title:string;
    description?:string;
    fields:FormField[];
}


export interface CustomerFormSchema {
    sections:FormSection[];
}



// De vaste schema's per opdrachtgever (geseed in de database, maar hier ook
// beschikbaar als bron). De sleutel is de klantnaam.

export const CUSTOMER_FORM_SCHEMAS:Record<string,CustomerFormSchema> = {

    "M-Cube":{
        sections:[
            {
                id:"location",
                title:"Locatiegegevens",
                fields:[
                    { id:"storeName", label:"Winkel/Locatienaam", type:"text", required:true },
                    { id:"storeNumber", label:"Winkelnummer", type:"text", required:true },
                    { id:"retailer", label:"Retailer", type:"text" },
                    { id:"region", label:"Regio", type:"text" }
                ]
            },
            {
                id:"installation",
                title:"Installatiedetails",
                fields:[
                    { id:"screenCount", label:"Aantal schermen", type:"number", required:true },
                    { id:"playerType", label:"Mediaplayer type", type:"text" },
                    { id:"networkType", label:"Netwerktype", type:"select", options:["Ethernet","WiFi","4G/LTE","Fiber"] },
                    { id:"mountingType", label:"Montagetype", type:"select", options:["Vloerstaand","Wandmontage","Plafondmontage","Tafel"] }
                ]
            }
        ]
    },

    "Axians":{
        sections:[
            {
                id:"project",
                title:"Projectinformatie",
                fields:[
                    { id:"projectNumber", label:"Projectnummer Axians", type:"text", required:true },
                    { id:"siteCode", label:"Sitecode", type:"text" },
                    { id:"workType", label:"Soort werkzaamheden", type:"select", options:["Installatie","Onderhoud","Storing","Uitbreiding","Vervanging"], required:true },
                    { id:"maintenanceContract", label:"Onderhoudscontract", type:"checkbox" }
                ]
            },
            {
                id:"network",
                title:"Netwerkinformatie",
                fields:[
                    { id:"ipRange", label:"IP-bereik", type:"text" },
                    { id:"vlan", label:"VLAN", type:"text" },
                    { id:"switchType", label:"Switch type", type:"text" },
                    { id:"cableType", label:"Kabeltype", type:"select", options:["CAT5e","CAT6","CAT6A","Fiber"] }
                ]
            }
        ]
    },

    "First Impression":{
        sections:[
            {
                id:"venue",
                title:"Locatiegegevens",
                fields:[
                    { id:"venueName", label:"Naam locatie", type:"text", required:true },
                    { id:"venueType", label:"Type locatie", type:"select", options:["Restaurant","Hotel","Retail","Corporate","Events","Other"], required:true },
                    { id:"systemType", label:"Systeem type", type:"text" }
                ]
            }
        ]
    },

    "Viewie Media":{
        sections:[
            {
                id:"digital_signage",
                title:"Digital Signage",
                fields:[
                    { id:"cmsVersion", label:"CMS Versie", type:"text" },
                    { id:"playerSerial", label:"Player serienummer", type:"text" },
                    { id:"resolution", label:"Resolutie", type:"select", options:["Full HD (1920x1080)","4K (3840x2160)","Portret FHD","Portret 4K"] },
                    { id:"orientation", label:"Oriëntatie", type:"select", options:["Landscape","Portrait"] }
                ]
            }
        ]
    },

    "Display4All":{
        sections:[
            {
                id:"display",
                title:"Display informatie",
                fields:[
                    { id:"displayBrand", label:"Merk display", type:"text" },
                    { id:"displaySize", label:"Schermgrootte (inch)", type:"number" },
                    { id:"installationType", label:"Installatietype", type:"select", options:["Nieuw","Vervanging","Uitbreiding","Service"], required:true }
                ]
            }
        ]
    },

    "NDI ICT Solutions":{
        sections:[
            {
                id:"ict",
                title:"ICT Details",
                fields:[
                    { id:"ticketNumber", label:"Ticketnummer NDI", type:"text" },
                    { id:"systemName", label:"Systeemnaam", type:"text" },
                    { id:"osVersion", label:"OS Versie", type:"text" }
                ]
            }
        ]
    },

    "IP Care":{
        sections:[
            {
                id:"care",
                title:"IP Care Details",
                fields:[
                    { id:"careLevel", label:"Zorgtype", type:"select", options:["Thuis","Zorginstelling","Ziekenhuis","Revalidatie"] },
                    { id:"roomNumber", label:"Kamer/afdeling", type:"text" }
                ]
            }
        ]
    },

    "Hofcon":{
        sections:[
            {
                id:"hofcon",
                title:"Hofcon Details",
                fields:[
                    { id:"workOrderHofcon", label:"Werkopdracht Hofcon", type:"text" },
                    { id:"location", label:"Locatie", type:"text" },
                    { id:"supervisor", label:"Toezichthouder", type:"text" }
                ]
            }
        ]
    },

    "Virupa":{
        sections:[
            {
                id:"virupa",
                title:"Virupa Details",
                fields:[
                    { id:"siteId", label:"Site ID", type:"text" },
                    { id:"installationType", label:"Type installatie", type:"text" }
                ]
            }
        ]
    },

    "Merit Media":{
        sections:[
            {
                id:"merit",
                title:"Merit Media Details",
                fields:[
                    { id:"campaignName", label:"Campagnenaam", type:"text" },
                    { id:"screenFormat", label:"Schermformaat", type:"text" }
                ]
            }
        ]
    },

    "Screenlink":{
        sections:[
            {
                id:"screenlink",
                title:"Screenlink Details",
                fields:[
                    { id:"locationCode", label:"Locatiecode", type:"text" },
                    { id:"playerModel", label:"Player model", type:"text" }
                ]
            }
        ]
    },

    "Marketing in Beeld":{
        sections:[
            {
                id:"marketing",
                title:"Marketing in Beeld Details",
                fields:[
                    { id:"clientName", label:"Opdrachtgever", type:"text" },
                    { id:"campaignId", label:"Campagne ID", type:"text" }
                ]
            }
        ]
    },

    "Comsysco":{
        sections:[
            {
                id:"comsysco",
                title:"Comsysco Details",
                fields:[
                    { id:"serviceOrder", label:"Service Order", type:"text" },
                    { id:"priority", label:"Prioriteit", type:"select", options:["Normaal","Hoog","Spoed"] }
                ]
            }
        ]
    },

    "HQ Healthcare":{
        sections:[
            {
                id:"healthcare",
                title:"Healthcare Details",
                fields:[
                    { id:"facilityType", label:"Type zorginstelling", type:"select", options:["Ziekenhuis","Kliniek","Apotheek","Huisarts","Verpleeghuis"] },
                    { id:"certificationRequired", label:"Certificering vereist", type:"checkbox" }
                ]
            }
        ]
    },

    "MDB Networks":{
        sections:[
            {
                id:"internal",
                title:"Interne werkbon",
                fields:[
                    { id:"internalProject", label:"Intern project", type:"text" },
                    { id:"department", label:"Afdeling", type:"text" },
                    { id:"billable", label:"Factureerbaar", type:"checkbox" }
                ]
            }
        ]
    }

};



// Veilig een schema uit onbekende data (bijv. Customer.formSchema Json) lezen.
export function parseCustomerSchema(
    value:unknown
):CustomerFormSchema | null {

    if(
        value &&
        typeof value === "object" &&
        Array.isArray((value as { sections?:unknown }).sections)
    ){
        return value as CustomerFormSchema;
    }

    return null;

}
