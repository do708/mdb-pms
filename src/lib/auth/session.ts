import { auth } from "@/auth";

export interface SessionUser {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

/**
 * ALLEEN server-side gebruiken (server components, route handlers).
 * In client components: useSession() uit "next-auth/react".
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
    const session = await auth();

    if (!session?.user) return null;

    return {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? "",
        role: session.user.role,
    };
}

/** Gooit een fout als er niemand is ingelogd. Handig in API routes. */
export async function requireUser(): Promise<SessionUser> {
    const user = await getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED");
    return user;
}

/** Gooit een fout als de rol niet is toegestaan. */
export async function requireRole(
    allowed: string[]
): Promise<SessionUser> {
    const user = await requireUser();
    if (!allowed.includes(user.role)) throw new Error("FORBIDDEN");
    return user;
}
