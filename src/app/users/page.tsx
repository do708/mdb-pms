"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DeleteButton from "@/components/DeleteButton";
import Link from "next/link";
import { canAccessAdmin } from "@/lib/auth/checkRole";
import {
    PageHeader,
    PageShell,
    SpecListRow,
    SpecPageCard,
} from "@/components/ui/SpecLayout";

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    active: boolean;
}

export default function UsersPage() {
    const { data: session, status } = useSession();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        const response = await fetch("/api/users");
        const data = await response.json();

        setUsers(data);
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    const userRole = session?.user?.role ?? "";

    if (status === "loading" || loading) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Gebruikers laden...</p>
            </PageShell>
        );
    }

    if (!canAccessAdmin(userRole)) {
        return (
            <PageShell>
                <p className="text-sm text-gray-500">Geen toegang</p>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <PageHeader
                title="👥 Gebruikersbeheer"
                subtitle="Beheer medewerkers en rollen"
                actions={
                    <Link
                        href="/users/new"
                        className="
                            bg-[#d6007e] text-white
                            px-5 py-3 rounded-xl font-bold
                        "
                    >
                        + Nieuwe gebruiker
                    </Link>
                }
            />

            <SpecPageCard>
                <h2 className="font-semibold text-sm text-gray-800">
                    Gebruikers
                </h2>

                <div className="space-y-2">
                    {users.map((user) => (
                        <SpecListRow
                            key={user.id}
                            className="
                                flex items-center justify-between gap-3
                            "
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm">
                                        {user.name || "Geen naam"}
                                    </span>

                                    <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">
                                        {user.role}
                                    </span>

                                    {!user.active && (
                                        <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                                            Uitgeschakeld
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500 truncate">
                                    {user.email}
                                </p>
                            </div>

                            <div className="flex gap-2 items-center shrink-0">
                                <Link
                                    href={`/users/${user.id}/edit`}
                                    className="
                                        text-sm text-blue-700
                                        border border-blue-200
                                        rounded-lg px-3 py-1.5
                                        hover:bg-blue-50
                                    "
                                >
                                    Wijzigen
                                </Link>

                                {session?.user?.id !== user.id && (
                                    <DeleteButton
                                        url={`/api/users/${user.id}`}
                                        label={`gebruiker ${user.name || user.email}`}
                                        onDeleted={load}
                                    />
                                )}
                            </div>
                        </SpecListRow>
                    ))}
                </div>
            </SpecPageCard>
        </PageShell>
    );
}
