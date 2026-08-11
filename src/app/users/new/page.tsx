"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
    STAFF_KIND_LABELS,
    STAFF_KINDS,
    type StaffKind,
} from "@/constants/staffKind";

export default function NewUserPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("engineer");
    const [staffKind, setStaffKind] = useState<StaffKind>("monteur");
    const [stagiaireUntil, setStagiaireUntil] = useState("");
    const [saving, setSaving] = useState(false);

    async function createUser() {
        setSaving(true);

        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role,
                    staffKind:
                        role === "engineer" ? staffKind : "monteur",
                    stagiaireUntil:
                        role === "engineer" && staffKind === "stagiaire"
                            ? stagiaireUntil
                            : null,
                }),
            });

            if (response.ok) {
                alert("Gebruiker aangemaakt");
                router.push("/users");
            } else {
                const data = await response.json().catch(() => ({}));
                alert(data.error || "Gebruiker aanmaken mislukt");
            }
        } catch (error) {
            console.error(error);
            alert("Fout bij aanmaken");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <header>
                <h1 className="text-2xl font-bold">➕ Nieuwe gebruiker</h1>
                <p className="text-gray-500">
                    Medewerker toevoegen aan MDB Project Management Systeem
                </p>
            </header>

            <section className="bg-white border rounded-2xl p-6 space-y-4">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Naam"
                    className="w-full border rounded-xl p-3"
                />

                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    type="email"
                    className="w-full border rounded-xl p-3"
                />

                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Wachtwoord"
                    type="password"
                    className="w-full border rounded-xl p-3"
                />

                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border rounded-xl p-3"
                >
                    <option value="admin">👑 Admin</option>
                    <option value="office">🏢 Kantoor</option>
                    <option value="engineer">👷 Monteur</option>
                </select>

                {role === "engineer" ? (
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <select
                                value={staffKind}
                                onChange={(e) =>
                                    setStaffKind(e.target.value as StaffKind)
                                }
                                className="w-full border rounded-xl p-3"
                            >
                                {STAFF_KINDS.map((kind) => (
                                    <option key={kind} value={kind}>
                                        {STAFF_KIND_LABELS[kind]}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400">
                                Inlener en stagiair tellen niet mee in de
                                bezettingsuren op de planning.
                            </p>
                        </div>
                        {staffKind === "stagiaire" ? (
                            <label className="block space-y-1">
                                <span className="text-sm text-gray-600">
                                    Stage tot en met *
                                </span>
                                <input
                                    type="date"
                                    value={stagiaireUntil}
                                    onChange={(e) =>
                                        setStagiaireUntil(e.target.value)
                                    }
                                    className="w-full border rounded-xl p-3"
                                    required
                                />
                                <p className="text-xs text-gray-400">
                                    Tot deze datum zichtbaar en inplanbaar in
                                    de planning; daarna niet meer.
                                </p>
                            </label>
                        ) : null}
                    </div>
                ) : null}

                <button
                    onClick={createUser}
                    disabled={saving}
                    className="
                        w-full bg-[#d6007e] text-white
                        rounded-xl py-4 font-bold
                    "
                >
                    {saving ? "Opslaan..." : "➕ Gebruiker opslaan"}
                </button>
            </section>
        </main>
    );
}
