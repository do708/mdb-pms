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
    ExternalLink
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
                subtitle="Handleidingen, certificaten en algemene bestanden. Bijlagen van opdrachten staan op de werkbon."
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
                                        href={doc.url}
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
