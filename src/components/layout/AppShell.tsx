"use client";

import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Login en de mobiele monteuromgeving hebben hun eigen layout
    const bare =
        pathname === "/login" || pathname.startsWith("/engineer");

    if (bare) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                <Header />

                <main className="flex-1 p-8">{children}</main>
            </div>
        </div>
    );
}
