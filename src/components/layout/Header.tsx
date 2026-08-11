"use client";

import { Menu } from "lucide-react";

import SearchBox from "./SearchBox";
import UserMenu from "./UserMenu";
import DateTime from "./DateTime";
import NotificationBell from "./NotificationBell";

export default function Header({
    onMenuOpen,
}: {
    onMenuOpen?: () => void;
}) {
    return (
        <header className="min-h-[3.5rem] sm:h-20 bg-white border-b border-gray-200 flex items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 shrink-0 print:hidden">
            <div className="flex items-center gap-2 sm:gap-6 min-w-0 flex-1">
                <button
                    type="button"
                    onClick={onMenuOpen}
                    className="lg:hidden flex items-center justify-center w-11 h-11 -ml-1 rounded-xl text-gray-700 hover:bg-gray-100 shrink-0"
                    aria-label="Menu openen"
                >
                    <Menu size={24} />
                </button>

                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                    <span className="sm:hidden">MDB PMS</span>
                    <span className="hidden sm:inline">
                        Project Management System
                    </span>
                </h1>

                <div className="hidden md:block flex-1 max-w-md">
                    <SearchBox />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className="hidden sm:block">
                    <DateTime />
                </div>

                <NotificationBell />

                <UserMenu />
            </div>
        </header>
    );
}
