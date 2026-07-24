import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";

import bcrypt from "bcryptjs";

export async function GET() {

    const guard = await requireApiRole(["admin"]);
    if (!guard.ok) return guard.response;

    try {

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(users);

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

        const body = await request.json();

        const email = String(body.email ?? "").trim().toLowerCase();
        const password = String(body.password ?? "");
        const role = body.role || "engineer";

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

        if (!["admin", "office", "engineer"].includes(role)) {
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
                active: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
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
