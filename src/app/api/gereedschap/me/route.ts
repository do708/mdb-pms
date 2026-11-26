import { NextResponse } from "next/server";

import { requireToolUser } from "@/lib/gereedschap/access";
import {
    canInspectTools,
    canManageTools,
    canViewAllAssets,
} from "@/lib/gereedschap/capabilities";

export async function GET() {
    const guard = await requireToolUser();
    if (!guard.ok) return guard.response;

    const { caps } = guard;

    return NextResponse.json({
        gereedschapBeheer: caps.gereedschapBeheer,
        keurmeester: caps.keurmeester,
        overzichtAlleAssets: caps.overzichtAlleAssets,
        canManage: canManageTools(caps),
        canInspect: canInspectTools(caps),
        canViewAll: canViewAllAssets(caps),
    });
}
