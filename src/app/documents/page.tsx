"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DeleteButton from "@/components/DeleteButton";
import DocumentDropzone from "@/components/documents/DocumentDropzone";
import {
    PageHeader,
    PageShell,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
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

    workorder?:{

        number:string;

        project?:{

            name:string;

            customer?:{

                name:string;

            }

        }

    }

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
                subtitle="Opdrachten, rapporten en bestanden"
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

                    {loading && (
                        <p className="text-sm text-gray-500">
                            Laden...
                        </p>
                    )}

                    {!loading && documents.length === 0 && (
                        <p className="text-sm text-gray-500">
                            Nog geen documenten beschikbaar.
                        </p>
                    )}

                    <div className="space-y-2">

                        {documents.map((doc)=>(

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

                                        <p className="text-xs text-gray-500 truncate">
                                            {doc.workorder?.number ?? ""}
                                            {" "}
                                            {doc.workorder?.project?.customer?.name ?? ""}
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
