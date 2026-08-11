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
    const isPlanning = pathname.startsWith("/planning");

    if (bare) {
        return <>{children}</>;
    }

    return (
        <div
            className="
                bg-[#f8fafc] flex
                h-dvh overflow-hidden
                print:h-auto print:overflow-visible print:bg-white
            "
        >
            {menuOpen ? (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden print:hidden"
                    aria-label="Menu sluiten"
                    onClick={() => setMenuOpen(false)}
                />
            ) : null}

            <Sidebar
                mobileOpen={menuOpen}
                onNavigate={() => setMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 min-h-0 w-full print:min-h-0 print:overflow-visible">
                <Header onMenuOpen={() => setMenuOpen(true)} />

                <main
                    className={`
                        flex-1 min-h-0
                        overflow-y-auto overflow-x-hidden
                        px-4 sm:px-6 lg:px-8
                        pb-4 sm:pb-6 lg:pb-8
                        max-w-full
                        print:overflow-visible print:px-0 print:pb-0 print:pt-0
                        ${isPlanning ? "pt-0" : "pt-4 sm:pt-6 lg:pt-8"}
                    `}
                >
                    {children}
                </main>

                {isEngineer ? <EngineerMobileNav /> : null}
            </div>
        </div>
    );
}
