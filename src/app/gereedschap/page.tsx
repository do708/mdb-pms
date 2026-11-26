"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ClipboardCheck,
    Package,
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

    const isFieldOnly =
        caps !== null &&
        !caps.canManage &&
        !caps.canInspect &&
        !caps.canViewAll;

    const cards = [
        {
            href: "/gereedschap/mijn",
            title: "Mijn gereedschap",
            desc: "Totaaloverzicht van wat op jouw naam staat",
            icon: Package,
            show: true,
            primary: isFieldOnly,
        },
        {
            href: "/gereedschap/keuring?scan=1",
            title: "QR scannen",
            desc: "Camera of code — open status van een asset",
            icon: QrCode,
            show: true,
            primary: isFieldOnly,
        },
        {
            href: "/gereedschap/keuring",
            title: "Keuringsportaal",
            desc: "Scan, keur, bekijk gepland en historie",
            icon: ClipboardCheck,
            show: Boolean(caps?.canInspect || !isFieldOnly),
            primary: false,
        },
        {
            href: "/gereedschap/beheer",
            title: "Beheerportaal",
            desc: "Register, toewijzing, QR en filters",
            icon: Shield,
            show: Boolean(caps?.canManage || caps?.canViewAll),
            primary: false,
        },
        {
            href: "/gereedschap/audit",
            title: "Audit / export",
            desc: "CSV, Excel of PDF-overzicht van het register",
            icon: FileSpreadsheet,
            show: Boolean(caps?.canViewAll),
            primary: false,
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
                {isFieldOnly ? (
                    <p className="text-sm text-slate-500">
                        Scan QR-codes en bekijk wat er op jouw naam staat.
                        Beheer en keuringen blijven bij kantoor / keurmeester.
                    </p>
                ) : null}
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
                                className={`
                                    rounded-2xl border bg-white
                                    p-5 shadow-sm transition
                                    ${
                                        card.primary
                                            ? "border-[#0066FF]/50 hover:border-[#0066FF] hover:bg-sky-50/50 ring-1 ring-[#0066FF]/15"
                                            : "border-slate-200 hover:border-[#0066FF]/40 hover:bg-sky-50/40"
                                    }
                                `}
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

            {isFieldOnly ? (
                <p className="text-sm text-slate-500 rounded-xl border border-slate-200 bg-white p-4">
                    Je ziet alleen assets die aan jou zijn toegewezen. Via QR
                    kun je van elk stuk de publieke keuringsstatus openen.
                </p>
            ) : null}
        </PageShell>
    );
}
