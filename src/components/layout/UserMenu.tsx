"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, RefreshCw } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const ROLE_LABELS: Record<string, string> = {
    admin: "Administrator",
    office: "Kantoor",
    engineer: "Monteur",
};

export default function UserMenu() {
    const [open, setOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const [mounted, setMounted] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const { data: session, status } = useSession();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        function onPointerDown(event: MouseEvent | TouchEvent) {
            const target = event.target as Node | null;
            if (
                buttonRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) {
                return;
            }
            setOpen(false);
        }

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("touchstart", onPointerDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("touchstart", onPointerDown);
        };
    }, [open]);

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

    function toggleMenu() {
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 8,
                right: Math.max(8, window.innerWidth - rect.right),
            });
        }
        setOpen((value) => !value);
    }

    const menu = open ? (
        <div
            ref={menuRef}
            className="fixed z-[200] w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-2 space-y-2"
            style={{ top: menuPos.top, right: menuPos.right }}
        >
            <button
                type="button"
                onClick={() => {
                    window.location.reload();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-100 text-sky-800 font-medium text-sm"
            >
                <RefreshCw size={16} />
                Vernieuwen
            </button>
            <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-100/70 text-yellow-700 font-medium text-sm"
            >
                <LogOut size={16} />
                Uitloggen
            </button>
        </div>
    ) : null;

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleMenu}
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

            {mounted ? createPortal(menu, document.body) : menu}
        </div>
    );
}
