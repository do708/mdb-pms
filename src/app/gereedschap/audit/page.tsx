"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageShell, SpecPanel } from "@/components/ui/SpecLayout";

export default function AuditPortaalPage() {
    const [allowed, setAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        fetch("/api/gereedschap/me")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setAllowed(Boolean(d?.canViewAll)))
            .catch(() => setAllowed(false));
    }, []);

    if (allowed === false) {
        return (
            <PageShell>
                <h1 className="text-2xl font-bold">Audit</h1>
                <p className="text-slate-600">
                    Alleen gebruikers met overzichtsrechten (Dominic, Linda,
                    Michel) kunnen exporteren.
                </p>
                <Link href="/gereedschap" className="text-[#0066FF] underline">
                    Terug
                </Link>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-sm text-[#0066FF] font-semibold">
                        Auditportaal
                    </p>
                    <h1 className="text-2xl font-bold">Exports</h1>
                    <p className="text-sm text-slate-500">
                        Eerste slice: CSV en Excel. PDF-audit is een
                        tekst-stub tot de volledige layout klaar is.
                    </p>
                </div>
                <Link
                    href="/gereedschap"
                    className="text-sm text-[#0066FF] underline"
                >
                    ← Hub
                </Link>
            </header>

            {allowed === null ? (
                <p className="text-sm text-slate-500">Rechten controleren…</p>
            ) : (
                <SpecPanel title="Register exporteren">
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="/api/gereedschap/export?format=csv"
                            className="rounded-xl bg-[#0066FF] px-5 py-3 text-white font-semibold"
                        >
                            CSV downloaden
                        </a>
                        <a
                            href="/api/gereedschap/export?format=xlsx"
                            className="rounded-xl bg-[#D6007E] px-5 py-3 text-white font-semibold"
                        >
                            Excel downloaden
                        </a>
                        <a
                            href="/api/gereedschap/export?format=pdf"
                            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800"
                        >
                            PDF-stub (tekst)
                        </a>
                    </div>
                </SpecPanel>
            )}
        </PageShell>
    );
}
