"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderPlus, Pencil } from "lucide-react";

import { getStatus } from "@/constants/workorderStatus";
import {
    archiveCompanyKey,
    archiveWorkorderTree,
    formatCompanyName,
    normalizeKey,
} from "@/lib/archive/formatArchiveLocationName";
import { SpecListRow, SpecPanel } from "@/components/ui/SpecLayout";

const FILE_DRAG = "application/x-mdb-archive-file";

export interface ArchiveWorkorder {
    id: string;
    number: string;
    title: string;
    city: string | null;
    status: string;
    plannedDate: string | null;
    customer: { name: string } | null;
    project: { customer: { name: string | null } | null } | null;
    assignedUser: { name: string | null } | null;
}

export interface ArchiveStoredFile {
    id: string;
    name: string;
    url: string;
    createdAt: string;
}

export interface StoredFolder {
    id: string;
    name: string;
    parentId: string | null;
    files: ArchiveStoredFile[];
    children: StoredFolder[];
}

interface TreeNode {
    key: string;
    name: string;
    path: string[];
    folderId?: string;
    files: ArchiveStoredFile[];
    workorders: ArchiveWorkorder[];
    children: TreeNode[];
}

function icoonVoor(naam: string): string {
    const n = naam.toLowerCase();

    if (n.endsWith(".msg") || n.endsWith(".eml")) return "✉️";
    if (n.endsWith(".pdf")) return "📄";
    if (n.match(/\.(png|jpe?g|gif|webp|heic)$/)) return "🖼️";

    return "📎";
}

function workorderCustomerName(workorder: ArchiveWorkorder) {
    return (
        workorder.customer?.name
        ?? workorder.project?.customer?.name
        ?? ""
    );
}

function emptyNode(name: string, path: string[]): TreeNode {
    return {
        key: path.map(archiveCompanyKey).join("/") || normalizeKey(name),
        name,
        path,
        files: [],
        workorders: [],
        children: [],
    };
}

function getOrCreate(
    list: TreeNode[],
    name: string,
    path: string[]
): TreeNode {
    const key = normalizeKey(name);
    const existing = list.find((node) => normalizeKey(node.name) === key);

    if (existing) {
        return existing;
    }

    const node = emptyNode(name, path);
    list.push(node);

    return node;
}

function buildWorkorderTree(workorders: ArchiveWorkorder[]): TreeNode[] {
    const roots: TreeNode[] = [];

    for (const workorder of workorders) {
        const tree = archiveWorkorderTree({
            customerName: workorderCustomerName(workorder),
            locatieRaw: workorder.title,
            plaatsRaw: workorder.city,
        });

        let siblings = roots;
        const path: string[] = [];

        for (const company of tree.companies) {
            path.push(company);
            const node = getOrCreate(siblings, company, [...path]);
            siblings = node.children;
        }

        path.push(tree.location);
        const location = getOrCreate(siblings, tree.location, [...path]);
        location.workorders.push(workorder);
    }

    function sortNodes(nodes: TreeNode[]) {
        nodes.sort((a, b) => a.name.localeCompare(b.name, "nl"));
        nodes.forEach((node) => sortNodes(node.children));
    }

    sortNodes(roots);

    return roots;
}

function mergeStored(
    virtual: TreeNode[],
    stored: StoredFolder[],
    parentPath: string[] = []
): TreeNode[] {
    const nodes = [...virtual];

    for (const folder of stored) {
        const path = [...parentPath, folder.name];
        const node = getOrCreate(nodes, folder.name, path);
        node.name = formatCompanyName(folder.name);
        node.folderId = folder.id;
        node.files = folder.files;
        node.children = mergeStored(node.children, folder.children, path);
    }

    nodes.sort((a, b) => a.name.localeCompare(b.name, "nl"));

    return nodes;
}

export default function ArchiveTree({
    workorders,
    storedFolders,
    canManage,
    onRefresh,
}: {
    workorders: ArchiveWorkorder[];
    storedFolders: StoredFolder[];
    canManage: boolean;
    onRefresh: () => Promise<void> | void;
}) {
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
    const [dropKey, setDropKey] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const tree = useMemo(
        () => mergeStored(buildWorkorderTree(workorders), storedFolders),
        [workorders, storedFolders]
    );

    function toggleFolder(key: string) {
        setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    async function ensureFolderId(node: TreeNode): Promise<string> {
        if (node.folderId) {
            return node.folderId;
        }

        let parentId: string | null = null;

        for (const name of node.path) {
            const res = await fetch("/api/archive/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, parentId }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || "Map aanmaken mislukt");
            }

            parentId = data.folder.id as string;
        }

        if (!parentId) {
            throw new Error("Map aanmaken mislukt");
        }

        return parentId;
    }

    async function createFolder(parent?: TreeNode) {
        const name = window.prompt(
            parent ? `Nieuwe map in ${parent.name}` : "Nieuwe map"
        )?.trim();

        if (!name) {
            return;
        }

        setBusy(true);

        try {
            const parentId = parent ? await ensureFolderId(parent) : null;
            const res = await fetch("/api/archive/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, parentId }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                alert(data?.error || "Map aanmaken mislukt");
                return;
            }

            await onRefresh();
        } finally {
            setBusy(false);
        }
    }

    async function renameFolder(node: TreeNode) {
        const name = window.prompt("Map hernoemen", node.name)?.trim();

        if (!name || name === node.name) {
            return;
        }

        setBusy(true);

        try {
            const folderId = await ensureFolderId(node);
            const res = await fetch(`/api/archive/folders/${folderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                alert(data?.error || "Hernoemen mislukt");
                return;
            }

            await onRefresh();
        } finally {
            setBusy(false);
        }
    }

    async function uploadFiles(node: TreeNode, files: FileList | File[]) {
        const list = Array.from(files);

        if (list.length === 0) {
            return;
        }

        setBusy(true);

        try {
            const folderId = await ensureFolderId(node);

            for (const file of list) {
                const body = new FormData();
                body.append("file", file);

                const res = await fetch(
                    `/api/archive/folders/${folderId}/files`,
                    { method: "POST", body }
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    alert(data?.error || `Uploaden mislukt: ${file.name}`);
                }
            }

            await onRefresh();
        } finally {
            setBusy(false);
        }
    }

    async function moveFile(fileId: string, node: TreeNode) {
        setBusy(true);

        try {
            const folderId = await ensureFolderId(node);
            const res = await fetch(`/api/archive/files/${fileId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                alert(data?.error || "Verplaatsen mislukt");
                return;
            }

            await onRefresh();
        } finally {
            setBusy(false);
        }
    }

    function renderWorkorder(workorder: ArchiveWorkorder) {
        return (
            <a
                key={workorder.id}
                href={`/workorders/${workorder.id}`}
                className="block"
            >
                <SpecListRow className="flex justify-between items-center hover:bg-gray-50 py-2">
                    <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                            {workorder.number} — {workorder.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {workorder.assignedUser?.name ?? "—"}
                            {workorder.plannedDate
                                ? ` · ${new Date(workorder.plannedDate).toLocaleDateString("nl-NL")}`
                                : ""}
                        </p>
                    </div>
                    <span
                        className={`
                            shrink-0 ml-2 px-2 py-0.5
                            rounded-full text-xs
                            ${getStatus(workorder.status).badge}
                        `}
                    >
                        {getStatus(workorder.status).label}
                    </span>
                </SpecListRow>
            </a>
        );
    }

    function renderFile(file: ArchiveStoredFile) {
        return (
            <div
                key={file.id}
                draggable={canManage}
                onDragStart={(e) => {
                    e.dataTransfer.setData(FILE_DRAG, file.id);
                    e.dataTransfer.effectAllowed = "move";
                }}
            >
                <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                >
                    <SpecListRow className="flex items-center gap-2 hover:bg-gray-50 py-2">
                        <span>{icoonVoor(file.name)}</span>
                        <span className="text-sm truncate">{file.name}</span>
                    </SpecListRow>
                </a>
            </div>
        );
    }

    function renderNode(node: TreeNode, depth: number) {
        const open = openFolders[node.key] === true;
        const locationCount = node.children.length;
        const isDrop = dropKey === node.key;

        return (
            <SpecPanel
                key={node.key}
                tone="white"
                className={`!p-0 overflow-hidden ${depth > 0 ? "ml-4" : ""} ${
                    isDrop ? "ring-2 ring-sky-400" : ""
                }`}
            >
                <div
                    className="flex items-center gap-1 pr-2 hover:bg-gray-50"
                    onDragOver={(e) => {
                        if (!canManage) return;
                        e.preventDefault();
                        setDropKey(node.key);
                    }}
                    onDragLeave={() => {
                        if (dropKey === node.key) setDropKey(null);
                    }}
                    onDrop={(e) => {
                        if (!canManage) return;
                        e.preventDefault();
                        setDropKey(null);

                        const fileId = e.dataTransfer.getData(FILE_DRAG);

                        if (fileId) {
                            void moveFile(fileId, node);
                            return;
                        }

                        if (e.dataTransfer.files?.length) {
                            void uploadFiles(node, e.dataTransfer.files);
                        }
                    }}
                >
                    <button
                        type="button"
                        onClick={() => toggleFolder(node.key)}
                        className={`
                            flex-1 flex items-center gap-2 px-3
                            ${depth === 0 ? "py-3 min-h-[52px]" : "py-2.5 min-h-[44px]"}
                            text-left
                        `}
                    >
                        {open ? (
                            <ChevronDown size={depth === 0 ? 20 : 18} />
                        ) : (
                            <ChevronRight size={depth === 0 ? 20 : 18} />
                        )}
                        <Folder
                            size={depth === 0 ? 20 : 18}
                            className={`shrink-0 ${
                                depth === 0 ? "text-[#0066FF]" : "text-sky-600"
                            }`}
                        />
                        <div className="flex-1 min-w-0">
                            <p className={`truncate text-gray-900 ${
                                depth === 0
                                    ? "font-semibold text-sm"
                                    : "font-medium text-sm"
                            }`}>
                                {node.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {node.children.length > 0
                                    ? `${locationCount} locatie${locationCount === 1 ? "" : "s"}`
                                    : `${node.workorders.length} opdracht${
                                        node.workorders.length === 1 ? "" : "en"
                                    }${
                                        node.files.length
                                            ? ` · ${node.files.length} bestand${
                                                node.files.length === 1 ? "" : "en"
                                            }`
                                            : ""
                                    }`}
                            </p>
                        </div>
                    </button>

                    {canManage ? (
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                title="Map hernoemen"
                                disabled={busy}
                                onClick={() => void renameFolder(node)}
                                className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                type="button"
                                title="Nieuwe submap"
                                disabled={busy}
                                onClick={() => void createFolder(node)}
                                className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            >
                                <FolderPlus size={14} />
                            </button>
                        </div>
                    ) : null}
                </div>

                {open ? (
                    <div className="border-t px-2 py-2 space-y-2">
                        {node.files.map(renderFile)}
                        {node.workorders.map(renderWorkorder)}
                        {node.children.map((child) => renderNode(child, depth + 1))}
                        {canManage && node.children.length === 0 && node.workorders.length === 0 && node.files.length === 0 ? (
                            <p className="text-xs text-gray-400 px-3 py-2">
                                Sleep bestanden hierheen
                            </p>
                        ) : null}
                    </div>
                ) : null}
            </SpecPanel>
        );
    }

    return (
        <div className="space-y-2">
            {canManage ? (
                <div className="flex justify-end">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => void createFolder()}
                        className="inline-flex items-center gap-1.5 text-sm border rounded-xl px-3 py-1.5 hover:bg-gray-50"
                    >
                        <FolderPlus size={16} />
                        Nieuwe map
                    </button>
                </div>
            ) : null}

            {tree.map((node) => renderNode(node, 0))}
        </div>
    );
}
