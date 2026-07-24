"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const ROLE_LABELS: Record<string, string> = {
    admin: "Administrator",
    office: "Kantoor",
    engineer: "Monteur",
};

export default function UserMenu() {
    const [open, setOpen] = useState(false);
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div className="h-10 w-32 rounded-xl bg-gray-100 animate-pulse" />;
    }

    const user = session?.user;
    if (!user) return null;

    const displayName = user.name || user.email || "Gebruiker";
    const initials = displayName
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
            >
                <div className="h-10 w-10 rounded-full bg-[#d6007e] text-white flex items-center justify-center font-semibold">
                    {initials}
                </div>

                <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">
                        {displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                        {ROLE_LABELS[user.role] ?? user.role}
                    </p>
                </div>
            </button>

            {open && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-100/70 text-yellow-700 font-medium text-sm hover:bg-yellow-200 transition"
                    >
                        <LogOut size={16} />
                        Uitloggen
                    </button>
                </div>
            )}
        </div>
    );
}
