export function contentTypeForFilename(
    name: string,
    fallback = "application/octet-stream"
): string {
    const lower = (name || "").toLowerCase();

    if (lower.endsWith(".pdf")) {
        return "application/pdf";
    }

    if (lower.endsWith(".png")) {
        return "image/png";
    }

    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
        return "image/jpeg";
    }

    if (lower.endsWith(".webp")) {
        return "image/webp";
    }

    if (lower.endsWith(".gif")) {
        return "image/gif";
    }

    if (lower.endsWith(".heic") || lower.endsWith(".heif")) {
        return "image/heic";
    }

    if (lower.endsWith(".dwg")) {
        return "application/acad";
    }

    if (lower.endsWith(".dxf")) {
        return "application/dxf";
    }

    return fallback;
}

export function contentTypeForFile(file: {
    name: string;
    type?: string | null;
}): string {
    const type = (file.type || "").trim().toLowerCase();

    if (
        type
        && type !== "application/octet-stream"
        && type !== "binary/octet-stream"
    ) {
        return type;
    }

    return contentTypeForFilename(file.name);
}

export function extensionForContentType(
    name: string,
    contentType: string
): string {
    const fromName = /\.[a-z0-9]+$/i.exec(name || "");

    if (fromName) {
        return fromName[0].toLowerCase();
    }

    const type = contentType.toLowerCase();

    if (type === "application/pdf") {
        return ".pdf";
    }

    if (type === "image/png") {
        return ".png";
    }

    if (type === "image/jpeg") {
        return ".jpg";
    }

    if (type === "image/webp") {
        return ".webp";
    }

    return "";
}
