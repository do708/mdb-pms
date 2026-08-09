"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
    PageHeader,
    PageShell,
    SpecFieldLabel,
    SpecPageCard,
    SpecPanel,
    specInputClassName,
} from "@/components/ui/SpecLayout";

export default function SettingsPage() {
    const { data: session } = useSession();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function changePassword() {
        setMessage("");
        setError("");

        if (newPassword !== repeatPassword) {
            setError("Nieuwe wachtwoorden komen niet overeen");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/profile/password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Wachtwoord gewijzigd");
                setCurrentPassword("");
                setNewPassword("");
                setRepeatPassword("");
            } else {
                setError(data.error ?? "Wachtwoord wijzigen mislukt");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageShell>
            <PageHeader title="Instellingen" subtitle="Jouw account" />

            <SpecPageCard className="max-w-md">
                <SpecPanel title="👤 Profiel" tone="slate">
                    <p>{session?.user?.name ?? "-"}</p>
                    <p className="text-gray-500">
                        {session?.user?.email ?? "-"}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                        Rol: {session?.user?.role ?? "-"}
                    </p>
                </SpecPanel>

                <SpecPanel title="🔑 Wachtwoord wijzigen">
                    <label className="block">
                        <SpecFieldLabel>Huidig wachtwoord</SpecFieldLabel>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) =>
                                setCurrentPassword(e.target.value)
                            }
                            placeholder="Huidig wachtwoord"
                            className={specInputClassName}
                        />
                    </label>

                    <label className="block">
                        <SpecFieldLabel>Nieuw wachtwoord</SpecFieldLabel>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nieuw wachtwoord (min. 8 tekens)"
                            className={specInputClassName}
                        />
                    </label>

                    <label className="block">
                        <SpecFieldLabel>Herhaal nieuw wachtwoord</SpecFieldLabel>
                        <input
                            type="password"
                            value={repeatPassword}
                            onChange={(e) =>
                                setRepeatPassword(e.target.value)
                            }
                            placeholder="Herhaal nieuw wachtwoord"
                            className={specInputClassName}
                        />
                    </label>

                    {error && <p className="text-red-600">{error}</p>}

                    {message && <p className="text-green-600">{message}</p>}

                    <button
                        onClick={changePassword}
                        disabled={saving}
                        className="
                            bg-black text-white rounded-xl
                            px-5 py-3 disabled:opacity-50
                        "
                    >
                        {saving ? "Bezig..." : "Wachtwoord wijzigen"}
                    </button>
                </SpecPanel>
            </SpecPageCard>
        </PageShell>
    );
}
