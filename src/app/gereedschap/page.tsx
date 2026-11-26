"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ClipboardCheck,
    QrCode,
    Shield,
    FileSpreadsheet,
    Wrench,
} from "lucide-react";

import { PageShell } from "@/components/ui/SpecLayout";

type Caps = {
    canManage: boolean;
    canInspect: boolean;
    canViewAll: boolean;
};

export default function GereedschapHubPage() {
    const [caps, setCaps] = useState<Caps | null>(null);

    useEffect(() => {
        fetch("/api/gereedschap/me")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (d) {
                    setCaps({
                        canManage: Boolean(d.canManage),
                        canInspect: Boolean(d.canInspect),
                        canViewAll: Boolean(d.canViewAll),
                    });
                } else {
                    setCaps({
                        canManage: false,
                        canInspect: false,
                        canViewAll: false,
                    });
                }
            })
            .catch(() =>
                setCaps({
                    canManage: false,
                    canInspect: false,
                    canViewAll: false,
                })
            );
    }, []);

    const cards = [
        {
            href: "/gereedschap/keuring",
            title: "Keuringsportaal",
            desc: "Scan, keur, bekijk gepland en historie",
            icon: ClipboardCheck,
            show: true,
        },
        {
            href: "/gereedschap/beheer",
            title: "Beheerportaal",
            desc: "Register, toewijzing, QR en filters",
            icon: Shield,
            show: Boolean(caps?.canManage || caps?.canViewAll),
        },
        {
            href: "/gereedschap/audit",
            title: "Audit / export",
            desc: "CSV, Excel of tekstexport van het register",
            icon: FileSpreadsheet,
            show: Boolean(caps?.canViewAll),
        },
        {
            href: "/gereedschap/keuring?scan=1",
            title: "QR scannen",
            desc: "Open status via camerascanner of code",
            icon: QrCode,
            show: true,
        },
    ];

    return (
        <PageShell>
            <header className="space-y-1">
                <p className="text-sm font-semibold text-[#0066FF]">
                    Tool &amp; Safety Management
                </p>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="h-7 w-7 text-[#0066FF]" />
                    Gereedschap
                </h1>
                <p className="text-sm text-slate-500 max-w-2xl">
                    Digitaal register, keuringen en QR-status. Rechten via
                    capability-flags op de gebruiker (beheer / keurmeester /
                    overzicht).
                </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
                {cards
                    .filter((c) => c.show)
                    .map((card) => {
                        const Icon = card.icon;
                        return (
                            <Link
                                key={card.href + card.title}
                                href={card.href}
                                className="
                                    rounded-2xl border border-slate-200 bg-white
                                    p-5 shadow-sm hover:border-[#0066FF]/40
                                    hover:bg-sky-50/40 transition
                                "
                            >
                                <Icon className="h-8 w-8 text-[#0066FF] mb-3" />
                                <h2 className="font-semibold text-slate-900">
                                    {card.title}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    {card.desc}
                                </p>
                            </Link>
                        );
                    })}
            </div>

            {!caps?.canManage && !caps?.canInspect && caps !== null ? (
                <p className="text-sm text-slate-500 rounded-xl border border-slate-200 bg-white p-4">
                    Je ziet alleen assets die aan jou zijn toegewezen. Scan een
                    QR of open je eigen rapporten via het keuringsportaal.
                </p>
            ) : null}
        </PageShell>
    );
}
