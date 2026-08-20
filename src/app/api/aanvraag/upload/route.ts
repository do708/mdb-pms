import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import {
    compressPhoto,
    photoStorageName,
} from "@/lib/images/compressPhoto";

export const maxDuration = 60;
export const runtime = "nodejs";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type BijlageResult = {
    url: string;
    name: string;
};

function isBlockedPhotoHost(hostname: string): boolean {
    const h = hostname.toLowerCase().replace(/\.$/, "");
    if (
        h === "localhost"
        || h === "127.0.0.1"
        || h === "0.0.0.0"
        || h === "::1"
        || h.endsWith(".local")
        || h.endsWith(".internal")
    ) {
        return true;
    }
    if (/^(10\.|192\.168\.|169\.254\.)/.test(h)) {
        return true;
    }
    const m = /^172\.(\d+)\./.exec(h);
    if (m) {
        const n = Number(m[1]);
        if (n >= 16 && n <= 31) {
            return true;
        }
    }
    return false;
}

function looksLikeImage(buffer: Buffer): boolean {
    if (buffer.length < 12) {
        return false;
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        return true;
    }
    if (
        buffer[0] === 0x89
        && buffer[1] === 0x50
        && buffer[2] === 0x4e
        && buffer[3] === 0x47
    ) {
        return true;
    }
    if (
        buffer.slice(0, 4).toString("ascii") === "RIFF"
        && buffer.slice(8, 12).toString("ascii") === "WEBP"
    ) {
        return true;
    }
    return false;
}

function looksLikePdf(buffer: Buffer): boolean {
    return buffer.length >= 4 && buffer.slice(0, 4).toString("ascii") === "%PDF";
}

async function storeAanvraagBuffer(args: {
    buffer: Buffer;
    contentType: string;
    originalName: string;
}): Promise<BijlageResult> {
    const isImage = args.contentType.startsWith("image/");

    const payload = isImage
        ? await compressPhoto(args.buffer, args.contentType)
        : {
            buffer: args.buffer,
            contentType: args.contentType || "application/pdf",
            extension: args.contentType === "application/pdf" ? ".pdf" : "",
            compressed: false,
        };

    const filename =
        `aanvragen/${Date.now()}-${photoStorageName(args.originalName, payload.extension)}`;

    const { data, error } = await supabase.storage
        .from("workorder-files")
        .upload(filename, payload.buffer, {
            contentType: payload.contentType,
            upsert: false,
        });

    if (error || !data) {
        throw new Error(error?.message || "Opslag van de bijlage is mislukt");
    }

    const { data: urlData } = supabase.storage
        .from("workorder-files")
        .getPublicUrl(data.path);

    return {
        url: urlData.publicUrl,
        name: args.originalName,
    };
}

async function importAanvraagFromUrl(rawUrl: string): Promise<BijlageResult> {
    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error("Ongeldige link");
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Alleen http(s)-links zijn toegestaan");
    }

    if (isBlockedPhotoHost(parsed.hostname)) {
        throw new Error("Deze link is niet toegestaan");
    }

    const pathName = decodeURIComponent(
        parsed.pathname.split("/").pop() || "bestand"
    );

    try {
        const response = await fetch(parsed.toString(), {
            redirect: "follow",
            headers: { Accept: "image/*,application/pdf,*/*" },
        });

        if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            const headerType =
                (response.headers.get("content-type") || "")
                    .split(";")[0]
                    .trim()
                    .toLowerCase();

            if (
                buffer.length > 0
                && buffer.length <= 12 * 1024 * 1024
            ) {
                if (headerType.startsWith("image/") || looksLikeImage(buffer)) {
                    return storeAanvraagBuffer({
                        buffer,
                        contentType: headerType.startsWith("image/")
                            ? headerType
                            : "image/jpeg",
                        originalName: pathName || "foto",
                    });
                }

                if (headerType === "application/pdf" || looksLikePdf(buffer)) {
                    return storeAanvraagBuffer({
                        buffer,
                        contentType: "application/pdf",
                        originalName: pathName.endsWith(".pdf")
                            ? pathName
                            : `${pathName || "document"}.pdf`,
                    });
                }
            }
        }
    } catch (error) {
        console.warn("AANVRAAG URL FETCH FAILED", rawUrl, error);
    }

    return {
        url: parsed.toString(),
        name: pathName || "Afbeeldingslink",
    };
}

async function customerFromToken(token: string) {
    if (!token) {
        return null;
    }

    return prisma.customer.findUnique({
        where: { publicToken: token },
        select: { id: true },
    });
}

// Publiek: upload van een bijlage bij het aanvraagformulier. Alleen toegestaan
// met een geldige klant-token, en alleen foto's, PDF's of een afbeeldingslink.
export async function POST(
    request: NextRequest
){

    try {

        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            const body = (await request.json()) as {
                token?: unknown;
                urls?: unknown;
            };

            const token =
                typeof body.token === "string" ? body.token.trim() : "";

            const customer = await customerFromToken(token);

            if (!customer) {
                return NextResponse.json(
                    { success: false, error: token ? "Onbekende link" : "Geen token" },
                    { status: token ? 404 : 400 }
                );
            }

            const urls = Array.isArray(body.urls)
                ? body.urls.filter(
                    (u): u is string =>
                        typeof u === "string" && /^https?:\/\//i.test(u.trim())
                )
                : [];

            if (urls.length === 0) {
                return NextResponse.json(
                    { success: false, error: "Geen afbeeldingslink ontvangen" },
                    { status: 400 }
                );
            }

            const bijlagen: BijlageResult[] = [];

            for (const url of urls.slice(0, 12)) {
                bijlagen.push(await importAanvraagFromUrl(url.trim()));
            }

            return NextResponse.json({
                success: true,
                bijlagen,
            });
        }

        const formData =
            await request.formData();


        const token =
            formData.get("token") as string;


        const customer = await customerFromToken(token || "");


        if(!token){
            return NextResponse.json(
                { success:false, error:"Geen token" },
                { status:400 }
            );
        }


        if(!customer){
            return NextResponse.json(
                { success:false, error:"Onbekende link" },
                { status:404 }
            );
        }


        const file =
            formData.get("file") as File;


        if(!file){
            return NextResponse.json(
                { success:false, error:"Geen bestand ontvangen" },
                { status:400 }
            );
        }


        // Alleen afbeeldingen en PDF's toestaan.
        const toegestaan =
            file.type.startsWith("image/")
            || file.type === "application/pdf";

        if(!toegestaan){
            return NextResponse.json(
                { success:false, error:"Alleen foto's en PDF-bestanden zijn toegestaan" },
                { status:400 }
            );
        }


        const bytes =
            await file.arrayBuffer();

        const rawBuffer =
            Buffer.from(bytes);

        const result = await storeAanvraagBuffer({
            buffer: rawBuffer,
            contentType: file.type,
            originalName: file.name,
        });

        return NextResponse.json({
            success:true,
            url:result.url,
            name:result.name
        });

    } catch(error){

        console.error("AANVRAAG UPLOAD ERROR", error);

        return NextResponse.json(
            { success:false, error:"Upload mislukt" },
            { status:500 }
        );

    }

}
