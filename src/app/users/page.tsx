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
                title="Gebruikers"
                subtitle="Beheer medewerkers en rollen"
                actions={
                    <Link
                        href="/users/new"
                        className="
                            bg-[#d6007e] text-white
                            px-5 py-3 rounded-xl font-semibold
                        "
                    >
                        + Nieuwe gebruiker
                    </Link>
                }
            />

            <SpecPageCard>
                {users.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Nog geen gebruikers.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {users.map((user) => (
                            <SpecListRow
                                key={user.id}
                                className="
                                    flex flex-col gap-3
                                    sm:flex-row sm:items-center
                                    sm:justify-between
                                "
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-sm text-gray-900">
                                            {user.name || "Geen naam"}
                                        </span>

                                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                                            {user.role}
                                        </span>

                                        {!user.active && (
                                            <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                                                Uitgeschakeld
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                        {user.email}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 items-center shrink-0">
                                    <Link
                                        href={`/users/${user.id}/edit`}
                                        className="
                                            border border-gray-200
                                            rounded-lg px-3 py-1.5
                                            text-sm text-gray-700
                                            hover:bg-gray-50
                                        "
                                    >
                                        Wijzigen
                                    </Link>

                                    {session?.user?.id !== user.id && (
                                        <DeleteButton
                                            url={`/api/users/${user.id}`}
                                            label={`gebruiker ${user.name || user.email}`}
                                            onDeleted={load}
                                            compact
                                        />
                                    )}
                                </div>
                            </SpecListRow>
                        ))}
                    </div>
                )}
            </SpecPageCard>
        </PageShell>
    );
}
