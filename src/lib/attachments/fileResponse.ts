import { NextRequest, NextResponse } from "next/server";

export function attachmentNotFoundResponse(request?: NextRequest) {
    const accept = request?.headers.get("accept") ?? "";

    if (accept.includes("text/html")) {
        return new NextResponse(
            `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<title>Bestand niet gevonden</title>
</head>
<body style="font-family:sans-serif;padding:2rem;color:#111">
<p>Bestand niet gevonden in de opslag.</p>
</body>
</html>`,
            {
                status: 404,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "no-store",
                },
            }
        );
    }

    return NextResponse.json(
        { error: "Bestand niet gevonden in de opslag" },
        { status: 404 }
    );
}

export function contentDisposition(filename: string, inline: boolean): string {
    const safe = filename.replace(/"/g, "").replace(/[\r\n]/g, "") || "bestand";
    const ascii = safe.replace(/[^\x20-\x7E]/g, "_") || "bestand";
    const encoded = encodeURIComponent(safe);

    return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export function shouldInlineFile(name: string, contentType: string | null): boolean {
    const lower = name.toLowerCase();

    if (lower.endsWith(".msg") || lower.endsWith(".eml")) {
        return false;
    }

    if (lower.endsWith(".pdf") || contentType === "application/pdf") {
        return true;
    }

    if (
        contentType?.startsWith("image/")
        || /\.(png|jpe?g|gif|webp|svg)$/.test(lower)
    ) {
        return true;
    }

    if (lower.endsWith(".txt") || contentType === "text/plain") {
        return true;
    }

    return false;
}

export function fileDownloadResponse(options: {
    buffer: Buffer;
    filename: string;
    contentType: string | null;
    inline: boolean;
}) {
    return new NextResponse(new Uint8Array(options.buffer), {
        status: 200,
        headers: {
            "Content-Type": options.contentType || "application/octet-stream",
            "Content-Disposition": contentDisposition(
                options.filename,
                options.inline
            ),
            "Cache-Control": "no-store",
        },
    });
}
