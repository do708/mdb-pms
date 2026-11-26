import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import {
    canSeeAsset,
    requireToolUser,
} from "@/lib/gereedschap/access";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Ctx) {
    const guard = await requireToolUser();
    if (!guard.ok) return guard.response;

    try {
        const { id } = await context.params;
        const asset = await prisma.toolAsset.findFirst({
            where: { OR: [{ id }, { code: id }] },
            select: {
                id: true,
                code: true,
                assignedUserId: true,
            },
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset niet gevonden" },
                { status: 404 }
            );
        }

        if (!canSeeAsset(guard.caps, guard.user.id, asset.assignedUserId)) {
            return NextResponse.json(
                { error: "Geen toegang" },
                { status: 403 }
            );
        }

        const base =
            process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
            request.nextUrl.origin;
        const url = `${base}/asset/${asset.code}`;

        const png = await QRCode.toBuffer(url, {
            type: "png",
            width: 512,
            margin: 2,
            errorCorrectionLevel: "M",
        });

        return new NextResponse(new Uint8Array(png), {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "private, max-age=3600",
                "Content-Disposition": `inline; filename="${asset.code}-qr.png"`,
            },
        });
    } catch (error) {
        console.error("GEREEDSCHAP QR", error);
        return NextResponse.json(
            { error: "QR genereren mislukt" },
            { status: 500 }
        );
    }
}
