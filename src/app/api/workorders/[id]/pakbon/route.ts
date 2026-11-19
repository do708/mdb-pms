import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase/admin";
import { requireWorkorderAccess } from "@/lib/auth/guard";
import { ensurePakbonTables } from "@/lib/prismaEnsure";
import { contentTypeForFilename } from "@/lib/attachments/contentType";
import { supabaseStoragePathFromUrl } from "@/lib/documents/documentenboxStorage";
import {
    attachPakbonUrlToWorkorder,
    createPakbonForWorkorders,
    pakbonUrlFromFormData,
} from "@/lib/documents/attachPakbon";
import {
    downloadPakbonFromNas,
    uploadPakbonToNas,
} from "@/lib/documents/pakbonStorage";
import { isNasConfigured, nasPathFromStored } from "@/lib/nas/synologyConfig";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const guard = await requireWorkorderAccess(id);

    if (!guard.ok) {
        return guard.response;
    }

    try {
        const pakbonId = request.nextUrl.searchParams.get("pakbonId");

        await ensurePakbonTables();

        const workorder = await prisma.workorder.findUnique({
            where: { id },
            select: {
                id: true,
                number: true,
                formData: true,
            },
        });

        if (!workorder) {
            return NextResponse.json(
                { error: "Opdracht niet gevonden" },
                { status: 404 }
            );
        }

        let linked:
            | {
                  pakbon: {
                      id: string;
                      url: string;
                      originalName: string | null;
                      filename: string | null;
                  };
              }
            | undefined;
        try {
            const rows = await prisma.pakbonWorkorder.findMany({
                where: { workorderId: id },
                include: { pakbon: true },
                orderBy: { createdAt: "asc" },
            });
            linked = pakbonId
                ? rows.find((row) => row.pakbonId === pakbonId)
                : rows[0];
        } catch (pakbonError) {
            console.error("PAKBON RELATION LOAD ERROR", pakbonError);
        }

        let stored = linked?.pakbon.url || pakbonUrlFromFormData(workorder.formData);

        if (!stored) {
            return NextResponse.json(
                { error: "Geen pakbon geüpload" },
                { status: 404 }
            );
        }

        let buffer: Buffer;
        let filename =
            linked?.pakbon.originalName ||
            linked?.pakbon.filename ||
            "pakbon";

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

                    if (linked) {
                        await prisma.pakbon.update({
                            where: { id: linked.pakbon.id },
                            data: { url: nasUrl },
                        });
                    }

                    await attachPakbonUrlToWorkorder(id, nasUrl);
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
            select: { id: true, number: true },
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

        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadPakbonToNas(
            workorder.number,
            file.name,
            buffer,
            file.type || contentTypeForFilename(file.name)
        );

        const pakbon = await createPakbonForWorkorders([id], {
            url,
            originalName: file.name,
            filename: file.name,
            contentType: file.type || contentTypeForFilename(file.name),
        });

        return NextResponse.json({
            success: true,
            url,
            pakbonId: pakbon.id,
            viewUrl: `/api/workorders/${id}/pakbon?pakbonId=${encodeURIComponent(pakbon.id)}`,
        });
    } catch (error) {
        console.error("PAKBON UPLOAD ERROR", error);

        return NextResponse.json(
            { error: "Pakbon uploaden mislukt" },
            { status: 500 }
        );
    }
}
