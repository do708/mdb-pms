import type { NextAuthConfig } from "next-auth";

/**
 * Edge-veilige config: GEEN Prisma, GEEN bcrypt hier.
 * Deze wordt gebruikt door src/proxy.ts (middleware runtime).
 */
export const authConfig = {
    pages: {
        signIn: "/login",
    },

    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 8, // 8 uur werkdag
    },

    // Providers worden toegevoegd in src/auth.ts
    providers: [],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.role = user.role;
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },

        /**
         * Draait in de proxy (middleware) bij ELKE request die matcht.
         * false  -> NextAuth redirect zelf naar /login
         * true   -> doorlaten
         * Response -> eigen redirect
         */
        authorized({ auth, request }) {
            const { pathname } = request.nextUrl;
            const user = auth?.user;

            // Publiek
            if (
                pathname === "/login" ||
                pathname.startsWith("/api/auth")
            ) {
                // Al ingelogd? Niet nog een keer het loginscherm tonen.
                if (user && pathname === "/login") {
                    return Response.redirect(new URL("/", request.nextUrl));
                }
                return true;
            }

            if (!user) {
                // API's krijgen JSON, geen HTML-redirect
                if (pathname.startsWith("/api")) {
                    return new Response(
                        JSON.stringify({ error: "Niet ingelogd" }),
                        {
                            status: 401,
                            headers: { "Content-Type": "application/json" },
                        }
                    );
                }
                return false; // -> /login
            }

            const role = user.role;

            // API's: ingelogd zijn is hier genoeg.
            // De rolcontrole gebeurt in de route zelf (requireApiRole),
            // anders breken de fetch-calls uit de monteuromgeving.
            if (pathname.startsWith("/api")) {
                return true;
            }

            // Landingspagina: stuur door op basis van rol
            if (pathname === "/") {
                const target = role === "engineer" ? "/engineer" : "/dashboard";
                return Response.redirect(new URL(target, request.nextUrl));
            }

            // Monteur komt alleen in zijn eigen omgeving
            if (role === "engineer") {
                if (pathname.startsWith("/engineer")) return true;
                return Response.redirect(new URL("/engineer", request.nextUrl));
            }

            // Alleen admin bij gebruikersbeheer en instellingen
            if (
                (pathname.startsWith("/users") ||
                    pathname.startsWith("/settings")) &&
                role !== "admin"
            ) {
                return Response.redirect(new URL("/dashboard", request.nextUrl));
            }

            // admin + office: rest is toegestaan
            return true;
        },
    },
} satisfies NextAuthConfig;
