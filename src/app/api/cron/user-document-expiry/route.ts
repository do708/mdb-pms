import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ensureUserDocumentsTable } from "@/lib/users/ensureUserDocuments";
import {
    sendUserDocumentExpiryMail,
    type ExpiringUserDocument,
} from "@/lib/email/sendUserDocumentExpiryMail";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Dagelijks: mail projects@ over persoonsdocumenten die binnen 30 dagen
 * verlopen en nog niet genotificeerd zijn.
 *
 * Beveiliging: Authorization Bearer CRON_SECRET (Vercel Cron), of
 * ?secret=CRON_SECRET voor handmatige test.
 */
function authorize(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
        // Zonder secret: alleen in development toestaan
        return process.env.NODE_ENV !== "production";
    }

    const header = request.headers.get("authorization") || "";
    if (header === `Bearer ${secret}`) {
        return true;
    }

    const q = request.nextUrl.searchParams.get("secret");
    return q === secret;
}

export async function GET(request: NextRequest) {
    if (!authorize(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await ensureUserDocumentsTable();

        const now = new Date();
        const in30 = new Date(now);
        in30.setDate(in30.getDate() + 30);

        const docs = await prisma.userDocument.findMany({
            where: {
                neverExpires: false,
                expiresAt: {
                    not: null,
                    gte: now,
                    lte: in30,
                },
                expiryNotifiedAt: null,
            },
            include: {
                user: { select: { name: true, email: true } },
            },
            orderBy: { expiresAt: "asc" },
        });

        if (docs.length === 0) {
            return NextResponse.json({
                ok: true,
                notified: 0,
                message: "Geen documenten binnen 30 dagen zonder melding",
            });
        }

        const payload: ExpiringUserDocument[] = docs
            .filter((d) => d.expiresAt)
            .map((d) => ({
                id: d.id,
                type: d.type,
                number: d.number,
                expiresAt: d.expiresAt as Date,
                originalName: d.originalName,
                userName: d.user.name,
                userEmail: d.user.email,
            }));

        await sendUserDocumentExpiryMail(payload);

        const notifiedAt = new Date();
        await prisma.userDocument.updateMany({
            where: { id: { in: payload.map((p) => p.id) } },
            data: { expiryNotifiedAt: notifiedAt },
        });

        return NextResponse.json({
            ok: true,
            notified: payload.length,
            ids: payload.map((p) => p.id),
        });
    } catch (error) {
        console.error("USER DOCUMENT EXPIRY CRON", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Cron mislukt",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return GET(request);
}
