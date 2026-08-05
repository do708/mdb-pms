"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Folder, LayoutDashboard } from "lucide-react";

const links = [
    { href: "/engineer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/workorders", label: "Werkbonnen", icon: ClipboardList },
    { href: "/projects", label: "Projecten", icon: Folder },
];

function isActive(pathname: string, href: string): boolean {
    if (href === "/engineer") {
        return pathname === "/engineer" || pathname.startsWith("/engineer/");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

export default function EngineerMobileNav() {
    const pathname = usePathname();

    return (
        <nav
            className="
                lg:hidden
                shrink-0
                w-full
                bg-white
                border-t
                border-gray-200
            "
            aria-label="Hoofdnavigatie"
        >
            <div className="grid grid-cols-3 h-14">
                {links.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex
                                flex-col
                                items-center
                                justify-center
                                gap-0.5
                                h-14
                                px-2
                                text-xs
                                font-semibold
                                ${
                                    active
                                        ? "text-[#d6007e]"
                                        : "text-gray-600 active:bg-gray-100"
                                }
                            `}
                        >
                            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                            <span className="truncate max-w-full">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
