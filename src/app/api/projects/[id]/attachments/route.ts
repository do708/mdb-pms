import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireProjectAccess } from "@/lib/auth/guard";
import { removeAttachmentObject } from "@/lib/attachments/storage";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        const { id } = await context.params;
        const guard = await requireProjectAccess(id);

        if (!guard.ok) {
            return guard.response;
        }

        const bijlagen = await prisma.projectAttachment.findMany({
            where: { projectId: id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(bijlagen);
    } catch (error) {
        console.error("PROJECT ATTACHMENTS GET ERROR:", error);

        return NextResponse.json(
            { error: "Bijlagen ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        const { id } = await context.params;
        const guard = await requireApiRole(["admin", "office"]);

        if (!guard.ok) {
            return guard.response;
        }

        const project = await prisma.project.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project niet gevonden" },
                { status: 404 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Geen bestand ontvangen" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const veiligeNaam = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const opslagNaam =
            `projecten/${id}/plattegronden/${Date.now()}-${veiligeNaam}`;

        const { data, error } = await supabase.storage
            .from("workorder-files")
            .upload(opslagNaam, buffer, {
                contentType: file.type || "application/octet-stream",
                upsert: false,
            });

        if (error) {
            console.error(error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        const { data: urlData } = supabase.storage
            .from("workorder-files")
            .getPublicUrl(data.path);

        const attachment = await prisma.projectAttachment.create({
            data: {
                projectId: id,
                url: urlData.publicUrl,
                filename: data.path,
                originalName: file.name,
                contentType: file.type || null,
            },
        });

        return NextResponse.json(attachment);
    } catch (error) {
        console.error("PROJECT ATTACHMENTS POST ERROR:", error);

        return NextResponse.json(
            { error: "Bijlage opslaan mislukt" },
            { status: 500 }
        );
    }
}
