import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { parseStaffKind } from "@/constants/staffKind";
import { ensureGereedschapSchema } from "@/lib/prismaEnsure";

import bcrypt from "bcryptjs";

const USER_LIST_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    staffKind: true,
    active: true,
    gereedschapBeheer: true,
    keurmeester: true,
    overzichtAlleAssets: true,
} as const;

const USER_LIST_SELECT_LEGACY = {
    id: true,
    name: true,
    email: true,
    role: true,
    staffKind: true,
    active: true,
} as const;

export async function GET() {

    const guard = await requireApiRole(["admin", "office"]);
    if (!guard.ok) return guard.response;

    try {
        await ensureGereedschapSchema();

        try {
            const users = await prisma.user.findMany({
                select: USER_LIST_SELECT,
                orderBy: { name: "asc" },
            });
            return NextResponse.json(users);
        } catch (inner) {
            // Fallback als capability-kolommen nog ontbreken (pre-migrate).
            console.warn("USERS GET fallback zonder gereedschap-flags", inner);
            const users = await prisma.user.findMany({
                select: USER_LIST_SELECT_LEGACY,
                orderBy: { name: "asc" },
            });
            return NextResponse.json(
                users.map((u) => ({
                    ...u,
                    gereedschapBeheer: false,
                    keurmeester: false,
                    overzichtAlleAssets: false,
                }))
            );
        }

    } catch (error) {

        console.error("USERS GET ERROR", error);

        return NextResponse.json(
            { error: "Gebruikers ophalen mislukt" },
            { status: 500 }
        );
    }
}


export async function POST(request: Request) {

    const guard = await requireApiRole(["admin"]);
    if (!guard.ok) return guard.response;

    try {
        await ensureGereedschapSchema();

        const body = await request.json();

        const email = String(body.email ?? "").trim().toLowerCase();
        const password = String(body.password ?? "");
        const role = body.role || "engineer";
        const staffKind =
            role === "engineer"
                ? parseStaffKind(body.staffKind)
                : "monteur";

        let stagiaireUntil: Date | null = null;
        if (role === "engineer" && staffKind === "stagiaire") {
            const raw =
                typeof body.stagiaireUntil === "string"
                    ? body.stagiaireUntil.trim().slice(0, 10)
                    : "";
            if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                return NextResponse.json(
                    { error: "Vul de einddatum van de stageperiode in" },
                    { status: 400 }
                );
            }
            stagiaireUntil = new Date(`${raw}T12:00:00`);
        }

        if (!email || !password) {
            return NextResponse.json(
                { error: "E-mail en wachtwoord zijn verplicht" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Wachtwoord moet minimaal 8 tekens zijn" },
                { status: 400 }
            );
        }

        if (!["admin", "office", "engineer", "magazijn"].includes(role)) {
            return NextResponse.json(
                { error: "Ongeldige rol" },
                { status: 400 }
            );
        }

        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
            return NextResponse.json(
                { error: "Dit e-mailadres bestaat al" },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: body.name,
                email,
                password: passwordHash,
                role,
                staffKind,
                stagiaireUntil,
                active: true,
                gereedschapBeheer: Boolean(body.gereedschapBeheer),
                keurmeester: Boolean(body.keurmeester),
                overzichtAlleAssets: Boolean(body.overzichtAlleAssets),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                staffKind: true,
                stagiaireUntil: true,
                active: true,
                gereedschapBeheer: true,
                keurmeester: true,
                overzichtAlleAssets: true,
            },
        });

        return NextResponse.json(user, { status: 201 });

    } catch (error) {

        console.error("USER CREATE ERROR", error);

        return NextResponse.json(
            { error: "Gebruiker aanmaken mislukt" },
            { status: 500 }
        );
    }
}
