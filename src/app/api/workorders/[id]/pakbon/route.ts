import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { requireWorkorderAccess } from "@/lib/auth/guard";
import { contentTypeForFilename } from "@/lib/attachments/contentType";
import { supabaseStoragePathFromUrl } from "@/lib/documents/documentenboxStorage";
import {
    deletePakbonFromNas,
    downloadPakbonFromNas,
    uploadPakbonToNas,
} from "@/lib/documents/pakbonStorage";
import { isNasConfigured, nasPathFromStored } from "@/lib/nas/synologyConfig";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type FormDataObject = Record<string, unknown>;

function asObject(value: unknown): FormDataObject {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return { ...(value as FormDataObject) };
    }

    return {};
}

function pakbonUrlFromFormData(formData: unknown): string {
    const km = asObject(asObject(formData).klaarzetMateriaal);
    return typeof km.pakbonUrl === "string" ? km.pakbonUrl : "";
}

async function setPakbonUrl(workorderId: string, formData: unknown, url: string) {
    const next = asObject(formData);
    const km = asObject(next.klaarzetMateriaal);

    next.klaarzetMateriaal = {
        ...km,
        pakbonUrl: url,
    };

    await prisma.workorder.update({
        where: { id: workorderId },
        data: { formData: JSON.parse(JSON.stringify(next)) },
    });
}

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const guard = await requireWorkorderAccess(id);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const workorder = await prisma.workorder.findUnique({
            where: { id },
            select: { id: true, number: true, formData: true },
        });

        if (!workorder) {
            return NextResponse.json(
                { error: "Opdracht niet gevonden" },
                { status: 404 }
            );
        }

        let stored = pakbonUrlFromFormData(workorder.formData);

        if (!stored) {
            return NextResponse.json(
                { error: "Geen pakbon geüpload" },
                { status: 404 }
            );
        }

        let buffer: Buffer;
        let filename = "pakbon";

        if (nasPathFromStored(stored)) {
            buffer = await downloadPakbonFromNas(stored);
            filename = stored.split("/").pop() || filename;
        } else {
            const path = supabaseStoragePathFromUrl(stored);

            if (!path) {
                return NextResponse.json(
                    { error: "Pakbon niet gevonden in opslag" },
                    { status: 404 }
                );
            }

            const download = await supabase.storage
                .from("workorder-files")
                .download(path);

            if (download.error || !download.data) {
                return NextResponse.json(
                    { error: "Pakbon niet gevonden in opslag" },
                    { status: 404 }
                );
            }

            buffer = Buffer.from(await download.data.arrayBuffer());
            filename = path.split("/").pop() || filename;

            if (isNasConfigured()) {
                try {
                    const nasUrl = await uploadPakbonToNas(
                        workorder.number,
                        filename,
                        buffer,
                        contentTypeForFilename(filename)
                    );
                    await setPakbonUrl(id, workorder.formData, nasUrl);
                    await supabase.storage
                        .from("workorder-files")
                        .remove([path])
                        .catch(() => {});
                } catch (error) {
                    console.error("PAKBON NAS MIGRATE ERROR", id, error);
                }
            }
        }

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": contentTypeForFilename(filename),
                "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
            },
        });
    } catch (error) {
        console.error("PAKBON GET ERROR", error);

        return NextResponse.json(
            { error: "Pakbon ophalen mislukt" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const guard = await requireWorkorderAccess(id);

    if (!guard.ok) {
        return guard.response;
    }

    if (!isNasConfigured()) {
        return NextResponse.json(
            {
                error:
                    "NAS is niet ingesteld. Pakbonnen horen op de NAS, niet in Supabase.",
            },
            { status: 503 }
        );
    }

    try {
        const workorder = await prisma.workorder.findUnique({
            where: { id },
            select: { id: true, number: true, formData: true },
        });

        if (!workorder) {
            return NextResponse.json(
                { error: "Opdracht niet gevonden" },
                { status: 404 }
            );
        }

        const form = await request.formData();
        const file = form.get("file");

        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json(
                { error: "Geen bestand ontvangen" },
                { status: 400 }
            );
        }

        const previous = pakbonUrlFromFormData(workorder.formData);
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadPakbonToNas(
            workorder.number,
            file.name,
            buffer,
            file.type || contentTypeForFilename(file.name)
        );

        await setPakbonUrl(id, workorder.formData, url);

        if (previous && previous !== url) {
            if (nasPathFromStored(previous)) {
                await deletePakbonFromNas(previous);
            } else {
                const path = supabaseStoragePathFromUrl(previous);
                if (path) {
                    await supabase.storage
                        .from("workorder-files")
                        .remove([path])
                        .catch(() => {});
                }
            }
        }

        return NextResponse.json({
            success: true,
            url,
            viewUrl: `/api/workorders/${id}/pakbon`,
        });
    } catch (error) {
        console.error("PAKBON UPLOAD ERROR", error);

        return NextResponse.json(
            { error: "Pakbon uploaden mislukt" },
            { status: 500 }
        );
    }
}
