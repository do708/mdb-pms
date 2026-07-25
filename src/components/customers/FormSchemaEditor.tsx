"use client";

import { CustomerFormSchema, FormField, FormFieldType, FormSection } from "@/types/customerForms";



interface Props {
    schema:CustomerFormSchema;
    onChange:(schema:CustomerFormSchema)=>void;
}



const FIELD_TYPES:{ value:FormFieldType; label:string }[] = [
    { value:"text", label:"Tekst" },
    { value:"number", label:"Nummer" },
    { value:"select", label:"Keuzelijst" },
    { value:"checkbox", label:"Aanvinkvak" },
    { value:"textarea", label:"Tekstvak" },
    { value:"date", label:"Datum" },
    { value:"email", label:"E-mail" },
    { value:"phone", label:"Telefoon" }
];



function slug(text:string):string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,"_")
        .replace(/^_+|_+$/g,"")
        || `veld_${Date.now()}`;
}



export default function FormSchemaEditor({
    schema,
    onChange
}:Props){


    const sections =
        schema.sections ?? [];


    function updateSections(next:FormSection[]){
        onChange({ sections:next });
    }


    function addSection(){
        updateSections([
            ...sections,
            {
                id:`sectie_${Date.now()}`,
                title:"Nieuwe sectie",
                fields:[]
            }
        ]);
    }


    function removeSection(si:number){
        updateSections(sections.filter((_,i)=>i !== si));
    }


    function setSectionTitle(si:number, title:string){
        const next = [...sections];
        next[si] = { ...next[si], title };
        updateSections(next);
    }


    function addField(si:number){
        const next = [...sections];
        next[si] = {
            ...next[si],
            fields:[
                ...next[si].fields,
                {
                    id:`veld_${Date.now()}`,
                    label:"Nieuw veld",
                    type:"text"
                }
            ]
        };
        updateSections(next);
    }


    function removeField(si:number, fi:number){
        const next = [...sections];
        next[si] = {
            ...next[si],
            fields:next[si].fields.filter((_,i)=>i !== fi)
        };
        updateSections(next);
    }


    function setField(si:number, fi:number, patch:Partial<FormField>){
        const next = [...sections];
        const fields = [...next[si].fields];
        fields[fi] = { ...fields[fi], ...patch };
        next[si] = { ...next[si], fields };
        updateSections(next);
    }




    return (

        <div className="space-y-6">

            {
                sections.length === 0 && (
                    <p className="text-sm text-gray-400">
                        Nog geen vragen. Voeg hieronder een sectie toe.
                    </p>
                )
            }


            {
                sections.map((section,si)=>(

                    <div
                        key={si}
                        className="
                            border
                            rounded-2xl
                            p-5
                            bg-white
                            space-y-4
                        "
                    >

                        <div className="flex items-center gap-3">

                            <input
                                value={section.title}
                                onChange={(e)=>setSectionTitle(si, e.target.value)}
                                placeholder="Titel van de sectie"
                                className="
                                    flex-1
                                    border
                                    rounded-xl
                                    p-2.5
                                    font-semibold
                                "
                            />

                            <button
                                type="button"
                                onClick={()=>removeSection(si)}
                                className="text-red-500 hover:text-red-700 text-sm"
                            >
                                Sectie verwijderen
                            </button>

                        </div>


                        <div className="space-y-3">

                            {
                                section.fields.map((field,fi)=>(

                                    <div
                                        key={fi}
                                        className="
                                            border
                                            rounded-xl
                                            p-3
                                            bg-gray-50
                                            space-y-3
                                        "
                                    >

                                        <div className="
                                            grid
                                            grid-cols-1
                                            sm:grid-cols-2
                                            gap-3
                                        ">

                                            <label className="block">
                                                <span className="text-xs text-gray-500">
                                                    Vraag / label
                                                </span>
                                                <input
                                                    value={field.label}
                                                    onChange={(e)=>{
                                                        const label = e.target.value;
                                                        setField(si, fi, {
                                                            label,
                                                            id:
                                                                field.id.startsWith("veld_")
                                                                ?
                                                                slug(label)
                                                                :
                                                                field.id
                                                        });
                                                    }}
                                                    className="w-full border rounded-lg p-2 mt-1 bg-white"
                                                />
                                            </label>

                                            <label className="block">
                                                <span className="text-xs text-gray-500">
                                                    Type
                                                </span>
                                                <select
                                                    value={field.type}
                                                    onChange={(e)=>setField(si, fi, {
                                                        type:e.target.value as FormFieldType
                                                    })}
                                                    className="w-full border rounded-lg p-2 mt-1 bg-white"
                                                >
                                                    {
                                                        FIELD_TYPES.map(t=>(
                                                            <option key={t.value} value={t.value}>
                                                                {t.label}
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </label>

                                        </div>


                                        {
                                            field.type === "select" && (
                                                <label className="block">
                                                    <span className="text-xs text-gray-500">
                                                        Keuze-opties (gescheiden door komma&apos;s)
                                                    </span>
                                                    <input
                                                        value={(field.options ?? []).join(", ")}
                                                        onChange={(e)=>setField(si, fi, {
                                                            options:
                                                                e.target.value
                                                                .split(",")
                                                                .map(o=>o.trim())
                                                                .filter(Boolean)
                                                        })}
                                                        placeholder="Optie 1, Optie 2, Optie 3"
                                                        className="w-full border rounded-lg p-2 mt-1 bg-white"
                                                    />
                                                </label>
                                            )
                                        }


                                        <div className="flex items-center justify-between">

                                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={!!field.required}
                                                    onChange={(e)=>setField(si, fi, {
                                                        required:e.target.checked
                                                    })}
                                                />
                                                Verplicht veld
                                            </label>

                                            <button
                                                type="button"
                                                onClick={()=>removeField(si, fi)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                Veld verwijderen
                                            </button>

                                        </div>

                                    </div>

                                ))
                            }

                        </div>


                        <button
                            type="button"
                            onClick={()=>addField(si)}
                            className="
                                text-sm
                                border
                                border-dashed
                                rounded-xl
                                px-4
                                py-2
                                text-gray-600
                                hover:bg-gray-50
                            "
                        >
                            + Veld toevoegen
                        </button>

                    </div>

                ))
            }


            <button
                type="button"
                onClick={addSection}
                className="
                    text-sm
                    border
                    rounded-xl
                    px-4
                    py-2.5
                    font-medium
                    text-blue-600
                    hover:bg-blue-50
                "
            >
                + Sectie toevoegen
            </button>

        </div>

    );

}
