import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,

    providers: [
        Credentials({
            name: "Credentials",

            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },

            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email.toString().trim().toLowerCase();
                const password = credentials.password.toString();

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                // Altijd hashen vergelijken, ook als user niet bestaat,
                // zodat responstijd niet verraadt of een account bestaat.
                const hash =
                    user?.password ??
                    "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";

                const passwordValid = await bcrypt.compare(password, hash);

                if (!user || !user.active || !passwordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
});
