"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import Sidebar from "./Sidebar";
import Header from "./Header";
import EngineerMobileNav from "./EngineerMobileNav";

export default function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);

    const isEngineer = session?.user?.role === "engineer";

    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!menuOpen) {
            return;
        }

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = prev;
        };
    }, [menuOpen]);

    const bare = pathname === "/login" || pathname === "/aanvraag";

    if (bare) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            {menuOpen ? (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    aria-label="Menu sluiten"
                    onClick={() => setMenuOpen(false)}
                />
            ) : null}

            <Sidebar
                mobileOpen={menuOpen}
                onNavigate={() => setMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 w-full">
                <Header onMenuOpen={() => setMenuOpen(true)} />

                <main
                    className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden pb-[max(1rem,env(safe-area-inset-bottom))] ${
                        isEngineer
                            ? "max-lg:pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
                            : ""
                    }`}
                >
                    {children}
                </main>

                {isEngineer ? <EngineerMobileNav /> : null}
            </div>
        </div>
    );
}
