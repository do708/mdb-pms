import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guard";
import {
    canInspectTools,
    canManageTools,
    canViewAllAssets,
    loadToolCapabilities,
    type ToolCapabilities,
} from "@/lib/gereedschap/capabilities";
import type { SessionUser } from "@/lib/auth/session";

type Ok = {
    ok: true;
    user: SessionUser;
    caps: ToolCapabilities;
};

type Fail = { ok: false; response: NextResponse };

export async function requireToolUser(): Promise<Ok | Fail> {
    const guard = await requireApiUser();
    if (!guard.ok) return guard;

    const caps = await loadToolCapabilities(guard.user.id);
    return { ok: true, user: guard.user, caps };
}

export async function requireToolBeheer(): Promise<Ok | Fail> {
    const result = await requireToolUser();
    if (!result.ok) return result;
    if (!canManageTools(result.caps)) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Geen gereedschap-beheerrechten" },
                { status: 403 }
            ),
        };
    }
    return result;
}

export async function requireKeurmeester(): Promise<Ok | Fail> {
    const result = await requireToolUser();
    if (!result.ok) return result;
    if (!canInspectTools(result.caps)) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Geen keurmeester-rechten" },
                { status: 403 }
            ),
        };
    }
    return result;
}

export async function requireOverzicht(): Promise<Ok | Fail> {
    const result = await requireToolUser();
    if (!result.ok) return result;
    if (!canViewAllAssets(result.caps)) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Geen overzichtsrechten" },
                { status: 403 }
            ),
        };
    }
    return result;
}

/** Mag dit asset gezien worden door deze gebruiker? */
export function canSeeAsset(
    caps: ToolCapabilities,
    userId: string,
    assignedUserId: string | null
): boolean {
    if (canViewAllAssets(caps)) return true;
    return assignedUserId === userId;
}
