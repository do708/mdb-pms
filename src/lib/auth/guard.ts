import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "./session";

type GuardResult =
    | { ok: true; user: SessionUser }
    | { ok: false; response: NextResponse };

/**
 * Gebruik bovenaan een route handler:
 *
 *   const guard = await requireApiRole(["admin"]);
 *   if (!guard.ok) return guard.response;
 *   const user = guard.user;
 */
export async function requireApiRole(
    allowed: string[]
): Promise<GuardResult> {
    const user = await getCurrentUser();

    if (!user) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Niet ingelogd" },
                { status: 401 }
            ),
        };
    }

    if (!allowed.includes(user.role)) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Geen toegang" },
                { status: 403 }
            ),
        };
    }

    return { ok: true, user };
}

/** Alleen ingelogd zijn is genoeg. */
export async function requireApiUser(): Promise<GuardResult> {
    return requireApiRole(["admin", "office", "engineer"]);
}
