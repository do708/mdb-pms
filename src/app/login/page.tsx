"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function login() {
        setError(null);
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (!result || result.error) {
                setError("Onjuiste e-mail of wachtwoord.");
                return;
            }

            // "/" wordt door de proxy doorgestuurd naar
            // /engineer of /dashboard op basis van de rol.
            router.replace("/");
            router.refresh();
        } catch (e) {
            console.error(e);
            setError("Er ging iets mis bij het inloggen.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">

            <div className="w-full max-w-md mb-6 flex flex-col items-center text-center">

                <img
                    src="/images/MDB-Logo.png"
                    alt="MDB Networks"
                    className="w-[512px] max-w-full h-auto object-contain mb-4 mdb-logo-animate"
                />

                <h1 className="text-2xl font-bold">MDB Networks</h1>

                <p className="text-sm text-gray-500">
                    Project Management Systeem
                </p>

            </div>

            <section className="bg-white border rounded-2xl p-8 w-full max-w-md space-y-5 shadow-sm">

                <p className="text-sm text-gray-600">
                    Login om verder te gaan.
                </p>

                {error && (
                    <div
                        role="alert"
                        className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3"
                    >
                        {error}
                    </div>
                )}

                <input
                    type="email"
                    value={email}
                    autoComplete="username"
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && login()}
                    placeholder="E-mail"
                    className="w-full border rounded-xl p-3"
                />

                <input
                    type="password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && login()}
                    placeholder="Wachtwoord"
                    className="w-full border rounded-xl p-3"
                />

                <button
                    onClick={login}
                    disabled={loading || !email || !password}
                    className="w-full bg-[#d6007e] text-white rounded-xl py-4 font-bold disabled:opacity-50"
                >
                    {loading ? "Inloggen..." : "Inloggen"}
                </button>
            </section>
        </main>
    );
}
