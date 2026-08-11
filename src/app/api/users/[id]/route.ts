import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { parseStaffKind } from "@/constants/staffKind";

import bcrypt from "bcryptjs";

type Ctx = { params: Promise<{ id: string }> };


export async function GET(request: NextRequest, context: Ctx) {

    const guard = await requireApiRole(["admin"]);
    if (!guard.ok) return guard.response;

    try {

        const { id } = await context.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                staffKind: true,
                active: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Gebruiker niet gevonden" },
                { status: 404 }
            );
        }

        return NextResponse.json(user);

    } catch (error) {

        console.error("USER GET ERROR", error);

        return NextResponse.json(
            { error: "Gebruiker ophalen mislukt" },
            { status: 500 }
        );
    }
}


export async function PUT(request: NextRequest, context: Ctx) {

    const guard = await requireApiRole(["admin"]);
    if (!guard.ok) return guard.response;

    try {

        const { id } = await context.params;
        const body = await request.json();

        const data: {
            name?: string | null;
            email?: string;
            role?: string;
            staffKind?: string;
            active?: boolean;
            password?: string;
        } = {};

        if (body.name !== undefined) data.name = body.name;

        if (body.email !== undefined) {
            data.email = String(body.email).trim().toLowerCase();
        }

        if (body.role !== undefined) {
            if (!["admin", "office", "engineer"].includes(body.role)) {
                return NextResponse.json(
                    { error: "Ongeldige rol" },
                    { status: 400 }
                );
            }
            data.role = body.role;
        }

        if (body.active !== undefined) data.active = Boolean(body.active);

        // Wachtwoord reset: alleen als er een nieuw wachtwoord is meegestuurd
        if (body.password) {
            const password = String(body.password);

            if (password.length < 8) {
                return NextResponse.json(
                    { error: "Wachtwoord moet minimaal 8 tekens zijn" },
                    { status: 400 }
                );
            }

            data.password = await bcrypt.hash(password, 10);
        }

        // Voorkom dat de laatste admin zichzelf buitensluit
        if (
            id === guard.user.id &&
            (data.active === false || (data.role && data.role !== "admin"))
        ) {
            return NextResponse.json(
                { error: "Je kunt je eigen adminrechten niet intrekken" },
                { status: 400 }
            );
        }

        const existing = await prisma.user.findUnique({
            where: { id },
            select: { role: true },
        });
        if (!existing) {
            return NextResponse.json(
                { error: "Gebruiker niet gevonden" },
                { status: 404 }
            );
        }

        const nextRole = data.role ?? existing.role;
        if (nextRole === "engineer") {
            if (body.staffKind !== undefined || data.role !== undefined) {
                data.staffKind = parseStaffKind(body.staffKind);
            }
        } else {
            data.staffKind = "monteur";
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                staffKind: true,
                active: true,
            },
        });

        return NextResponse.json({ success: true, user });

    } catch (error) {

        console.error("USER UPDATE ERROR", error);

        return NextResponse.json(
            { error: "Gebruiker aanpassen mislukt" },
            { status: 500 }
        );
    }
}


export async function DELETE(request: NextRequest, context: Ctx) {

    const guard = await requireApiRole(["admin"]);
    if (!guard.ok) return guard.response;

    try {

        const { id } = await context.params;

        if (id === guard.user.id) {
            return NextResponse.json(
                { error: "Je kunt jezelf niet verwijderen" },
                { status: 400 }
            );
        }

        // Opdrachten en planningen verwijzen naar de gebruiker.
        // Daarom deactiveren i.p.v. hard verwijderen: de historie blijft kloppen.
        const linked = await prisma.workorder.count({
            where: { assignedUserId: id },
        });

        if (linked > 0) {
            const user = await prisma.user.update({
                where: { id },
                data: { active: false },
                select: { id: true, name: true, active: true },
            });

            return NextResponse.json({
                success: true,
                deactivated: true,
                message:
                    "Gebruiker heeft opdrachten en is daarom op inactief gezet.",
                user,
            });
        }

        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ success: true, deleted: true });

    } catch (error) {

        console.error("USER DELETE ERROR", error);

        return NextResponse.json(
            { error: "Gebruiker verwijderen mislukt" },
            { status: 500 }
        );
    }
}
