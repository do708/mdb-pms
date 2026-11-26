import { prisma } from "@/lib/prisma";
import {
    ensureGereedschapSchema,
    ensureGereedschapUserColumns,
} from "@/lib/prismaEnsure";

export type ToolCapabilities = {
    gereedschapBeheer: boolean;
    keurmeester: boolean;
    overzichtAlleAssets: boolean;
};

export const EMPTY_TOOL_CAPS: ToolCapabilities = {
    gereedschapBeheer: false,
    keurmeester: false,
    overzichtAlleAssets: false,
};

export async function loadToolCapabilities(
    userId: string
): Promise<ToolCapabilities> {
    await ensureGereedschapSchema();

    let user: {
        gereedschapBeheer: boolean;
        keurmeester: boolean;
        overzichtAlleAssets: boolean;
        role: string;
    } | null = null;

    try {
        user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                gereedschapBeheer: true,
                keurmeester: true,
                overzichtAlleAssets: true,
                role: true,
            },
        });
    } catch {
        // Pre-migrate: alleen role beschikbaar.
        const legacy = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!legacy) return EMPTY_TOOL_CAPS;
        if (legacy.role === "admin") {
            return {
                gereedschapBeheer: true,
                keurmeester: true,
                overzichtAlleAssets: true,
            };
        }
        return EMPTY_TOOL_CAPS;
    }

    if (!user) return EMPTY_TOOL_CAPS;

    // Admin mag altijd alles (capability-flags blijven configureerbaar
    // voor office/monteur; admin is fallback-superuser).
    if (user.role === "admin") {
        return {
            gereedschapBeheer: true,
            keurmeester: true,
            overzichtAlleAssets: true,
        };
    }

    return {
        gereedschapBeheer: user.gereedschapBeheer,
        keurmeester: user.keurmeester,
        overzichtAlleAssets: user.overzichtAlleAssets,
    };
}

export function canManageTools(caps: ToolCapabilities): boolean {
    return caps.gereedschapBeheer;
}

export function canInspectTools(caps: ToolCapabilities): boolean {
    return caps.keurmeester;
}

export function canViewAllAssets(caps: ToolCapabilities): boolean {
    return caps.overzichtAlleAssets || caps.gereedschapBeheer;
}
