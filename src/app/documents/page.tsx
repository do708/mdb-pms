"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import DeleteButton from "@/components/DeleteButton";
import DocumentDropzone from "@/components/documents/DocumentDropzone";
import {
    PageHeader,
    PageShell,
    SpecFieldLabel,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
    specSelectClassName,
} from "@/components/ui/SpecLayout";

import {
    FileText,
    ExternalLink,
    Pencil,
} from "lucide-react";



interface DocumentItem {

    id:string;

    name:string;

    type:string;

    url:string;

    createdAt:string;

}




export default function DocumentsPage(){


    const [documents,setDocuments] =
        useState<DocumentItem[]>([]);


    const [loading,setLoading] =
        useState(true);




    const { data:session } =
        useSession();


    const role =
        session?.user?.role;


    const canUpload =
        role === "admin" ||
        role === "office";

    const [sort, setSort] = useState<"name" | "createdAt">("name");

    const sortedDocuments = useMemo(() => {
        const list = Array.isArray(documents) ? [...documents] : [];

        if (sort === "name") {
            list.sort((a, b) =>
                a.name.localeCompare(b.name, "nl", { sensitivity: "base" })
            );
        } else {
            list.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );
        }

        return list;
    }, [documents, sort]);


    async function renameDocument(doc: DocumentItem) {
        const next = window.prompt("Bestandsnaam wijzigen", doc.name)?.trim();

        if (!next || next === doc.name) {
            return;
        }

        const response = await fetch(`/api/documents/${doc.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: next }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            alert(
                typeof data.error === "string"
                    ? data.error
                    : "Hernoemen mislukt"
            );
            return;
        }

        await loadDocuments();
    }

    async function loadDocuments(){


        const response =
            await fetch("/api/documents");


        const data =
            await response.json();


        setDocuments(data);


        setLoading(false);

    }


    useEffect(()=>{

        loadDocuments();

    },[]);






    return (

        <PageShell>


            <PageHeader
                title="Documenten"
            />


            {
                canUpload && (

                    <SpecPanel tone="slate" title="Uploaden">
                        <DocumentDropzone
                            onUploaded={loadDocuments}
                        />
                    </SpecPanel>

                )
            }


            <SpecPageCard>

                <SpecPanel title="Document overzicht">

                    <label className="block max-w-xs">
                        <SpecFieldLabel>Sorteren</SpecFieldLabel>
                        <select
                            value={sort}
                            onChange={(e) =>
                                setSort(
                                    e.target.value === "createdAt"
                                        ? "createdAt"
                                        : "name"
                                )
                            }
                            className={specSelectClassName}
                        >
                            <option value="name">Alfabetisch (A–Z)</option>
                            <option value="createdAt">
                                Datum toegevoegd (nieuwste eerst)
                            </option>
                        </select>
                    </label>

                    {loading && (
                        <p className="text-sm text-gray-500">
                            Laden...
                        </p>
                    )}

                    {!loading && documents.length === 0 && (
                        <p className="text-sm text-gray-500">
                            Nog geen documenten in de documentenbox.
                        </p>
                    )}

                    <div className="space-y-2">

                        {sortedDocuments.map((doc)=>(

                            <SpecListRow
                                key={doc.id}
                                className="
                                    flex flex-wrap items-center
                                    justify-between gap-3
                                "
                            >

                                <div className="flex gap-3 items-center min-w-0">

                                    <FileText size={20} className="shrink-0 text-gray-500" />

                                    <div className="min-w-0">

                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {doc.name}
                                        </p>

                                    </div>

                                </div>

                                <div className="flex gap-3 items-center shrink-0">

                                    <a
                                        href={`/api/documents/${doc.id}`}
                                        target="_blank"
                                        className="
                                            text-sm text-sky-700
                                            flex gap-1.5 items-center
                                            hover:underline
                                        "
                                    >
                                        Open
                                        <ExternalLink size={14}/>
                                    </a>

                                    {canUpload && (
                                        <button
                                            type="button"
                                            title="Naam wijzigen"
                                            onClick={() =>
                                                void renameDocument(doc)
                                            }
                                            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    )}

                                    <DeleteButton
                                        url={`/api/documents/${doc.id}`}
                                        label={`document "${doc.name}"`}
                                        onDeleted={loadDocuments}
                                        compact
                                    />

                                </div>

                            </SpecListRow>

                        ))}

                    </div>

                </SpecPanel>

            </SpecPageCard>


        </PageShell>

    );

}
