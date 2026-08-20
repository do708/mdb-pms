import { createClient } from "@supabase/supabase-js";

const BUCKET = "workorder-files";
const URL_MARKER = "/workorder-files/";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class AttachmentNotFoundError extends Error {
    constructor() {
        super("Bestand niet gevonden in de opslag");
        this.name = "AttachmentNotFoundError";
    }
}

function pathFromPublicUrl(url: string): string | null {
    const index = url.indexOf(URL_MARKER);

    if (index === -1) {
        return null;
    }

    const raw = url.slice(index + URL_MARKER.length).split("?")[0];

    if (!raw) {
        return null;
    }

    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}

export function attachmentStoragePath(attachment: {
    filename: string | null;
    url: string;
}): string | null {
    const stored = attachment.filename?.trim();

    if (stored && !stored.startsWith("http://") && !stored.startsWith("https://")) {
        return stored.replace(/^\/+/, "");
    }

    return pathFromPublicUrl(attachment.url);
}

function isMissingObject(error: { message?: string; statusCode?: string } | null): boolean {
    if (!error) {
        return false;
    }

    const status = String(error.statusCode ?? "");
    const message = (error.message ?? "").toLowerCase();

    return (
        status === "404"
        || message.includes("not found")
        || message.includes("nosuchkey")
        || message.includes("object not found")
    );
}

export async function downloadAttachmentBytes(attachment: {
    filename: string | null;
    url: string;
}): Promise<Buffer> {
    const path = attachmentStoragePath(attachment);

    if (!path) {
        throw new AttachmentNotFoundError();
    }

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .download(path);

    if (error || !data) {
        if (isMissingObject(error) || !data) {
            throw new AttachmentNotFoundError();
        }

        throw error;
    }

    return Buffer.from(await data.arrayBuffer());
}
