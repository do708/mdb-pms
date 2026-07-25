"use client";

import { CustomerFormSchema, FormField } from "@/types/customerForms";



interface Props {

    schema:CustomerFormSchema;

    // De huidige antwoorden (per veld-id)
    values:Record<string,unknown>;

    // Wijziging doorgeven aan de ouder
    onChange:(fieldId:string, value:unknown)=>void;

    disabled?:boolean;

}



function Field({
    field,
    value,
    onChange,
    disabled
}:{
    field:FormField;
    value:unknown;
    onChange:(v:unknown)=>void;
    disabled?:boolean;
}){


    const label =
        (
            <span className="
                block
                text-sm
                font-medium
                text-gray-700
                mb-1
            ">
                {field.label}
                {
                    field.required && (
                        <span className="text-rose-500"> *</span>
                    )
                }
            </span>
        );


    const baseInput =
        `
            w-full
            border
            rounded-xl
            p-3
            bg-white
            disabled:bg-gray-50
        `;




    if(field.type === "checkbox"){
        return (
            <label className="
                flex
                items-center
                gap-2
                cursor-pointer
                select-none
            ">
                <input
                    type="checkbox"
                    checked={Boolean(value)}
                    disabled={disabled}
                    onChange={(e)=>onChange(e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                    {field.label}
                    {
                        field.required && (
                            <span className="text-rose-500"> *</span>
                        )
                    }
                </span>
            </label>
        );
    }


    if(field.type === "select"){
        return (
            <label className="block">
                {label}
                <select
                    value={String(value ?? "")}
                    disabled={disabled}
                    onChange={(e)=>onChange(e.target.value)}
                    className={baseInput}
                >
                    <option value="">
                        {field.placeholder ?? "Selecteer..."}
                    </option>
                    {
                        field.options?.map(opt=>(
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))
                    }
                </select>
                {
                    field.helpText && (
                        <span className="text-xs text-gray-400">
                            {field.helpText}
                        </span>
                    )
                }
            </label>
        );
    }


    if(field.type === "textarea"){
        return (
            <label className="block">
                {label}
                <textarea
                    value={String(value ?? "")}
                    disabled={disabled}
                    rows={3}
                    placeholder={field.placeholder}
                    onChange={(e)=>onChange(e.target.value)}
                    className={baseInput}
                />
                {
                    field.helpText && (
                        <span className="text-xs text-gray-400">
                            {field.helpText}
                        </span>
                    )
                }
            </label>
        );
    }


    // text / number / date / email / phone
    const htmlType =
        field.type === "number"
        ?
        "number"
        :
        field.type === "date"
        ?
        "date"
        :
        field.type === "email"
        ?
        "email"
        :
        field.type === "phone"
        ?
        "tel"
        :
        "text";


    return (
        <label className="block">
            {label}
            <input
                type={htmlType}
                value={String(value ?? "")}
                disabled={disabled}
                placeholder={field.placeholder}
                onChange={(e)=>onChange(e.target.value)}
                className={baseInput}
            />
            {
                field.helpText && (
                    <span className="text-xs text-gray-400">
                        {field.helpText}
                    </span>
                )
            }
        </label>
    );

}




export default function CustomerFormSection({
    schema,
    values,
    onChange,
    disabled
}:Props){


    if(!schema?.sections?.length){
        return null;
    }


    return (

        <div className="space-y-6">

            {
                schema.sections.map(section=>{

                    const checkboxes =
                        section.fields.filter(
                            f=>f.type === "checkbox"
                        );

                    const regular =
                        section.fields.filter(
                            f=>f.type !== "checkbox"
                        );


                    return (

                        <div
                            key={section.id}
                            className="
                                border
                                rounded-2xl
                                p-5
                                bg-white
                            "
                        >

                            <h3 className="
                                font-bold
                                mb-1
                            ">
                                {section.title}
                            </h3>

                            {
                                section.description && (
                                    <p className="
                                        text-sm
                                        text-gray-500
                                        mb-4
                                    ">
                                        {section.description}
                                    </p>
                                )
                            }


                            {
                                regular.length > 0 && (
                                    <div className="
                                        grid
                                        grid-cols-1
                                        sm:grid-cols-2
                                        gap-4
                                        mt-3
                                    ">
                                        {
                                            regular.map(field=>(
                                                <div
                                                    key={field.id}
                                                    className={
                                                        field.type === "textarea"
                                                        ?
                                                        "sm:col-span-2"
                                                        :
                                                        ""
                                                    }
                                                >
                                                    <Field
                                                        field={field}
                                                        value={values[field.id]}
                                                        disabled={disabled}
                                                        onChange={(v)=>onChange(field.id, v)}
                                                    />
                                                </div>
                                            ))
                                        }
                                    </div>
                                )
                            }


                            {
                                checkboxes.length > 0 && (
                                    <div className="
                                        space-y-3
                                        mt-4
                                    ">
                                        {
                                            checkboxes.map(field=>(
                                                <Field
                                                    key={field.id}
                                                    field={field}
                                                    value={values[field.id]}
                                                    disabled={disabled}
                                                    onChange={(v)=>onChange(field.id, v)}
                                                />
                                            ))
                                        }
                                    </div>
                                )
                            }

                        </div>

                    );

                })
            }

        </div>

    );

}
