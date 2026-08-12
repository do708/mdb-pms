export function isNasArchiveEnabled(): boolean {
    return process.env.STORAGE_ARCHIVE_ENABLED === "true";
}

export function synologyBaseUrl(): string {
    return (
        process.env.SYNO_BASE_URL?.replace(/\/$/, "")
        || "https://mdbnetworks.de7.quickconnect.to:5001"
    );
}

export function synologyArchiveRoot(): string {
    const root = process.env.SYNO_ARCHIVE_ROOT?.replace(/\/$/, "")
        || "/mdb-pms/archief";

    return root.startsWith("/") ? root : `/${root}`;
}

export function synologyCredentials(): {
    username: string;
    password: string;
} | null {
    const username = process.env.SYNO_USERNAME?.trim();
    const password = process.env.SYNO_PASSWORD;

    if (!username || !password) {
        return null;
    }

    return { username, password };
}

export function joinNasPath(...parts: string[]): string {
    return parts
        .filter(Boolean)
        .map((part) => part.replace(/^\/+|\/+$/g, ""))
        .join("/")
        .replace(/^([^/])/, "/$1");
}
