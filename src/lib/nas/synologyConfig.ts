export function isNasArchiveEnabled(): boolean {
    return process.env.STORAGE_ARCHIVE_ENABLED === "true";
}

export function synologyBaseUrl(): string {
    return (
        process.env.SYNO_BASE_URL?.replace(/\/$/, "")
        || "https://mdbnetworks.de7.quickconnect.to"
    );
}

export function synologyArchiveRoot(): string {
    const root = process.env.SYNO_ARCHIVE_ROOT?.replace(/\/$/, "")
        || "/mdb-pms/archief";

    return root.startsWith("/") ? root : `/${root}`;
}

/** Referer voor QuickConnect-relay (bijv. https://mdbnetworks.quickconnect.to/). */
export function synologyQuickConnectReferer(): string | null {
    const explicitId = process.env.SYNO_QUICKCONNECT_ID?.trim();

    if (explicitId) {
        return `https://${explicitId}.quickconnect.to/`;
    }

    const base = process.env.SYNO_BASE_URL?.replace(/\/$/, "");

    if (!base) {
        return "https://mdbnetworks.quickconnect.to/";
    }

    const relayMatch = base.match(
        /https?:\/\/([^.]+)\.[a-z]{2}\d+\.quickconnect\.to/i
    );

    if (relayMatch) {
        return `https://${relayMatch[1]}.quickconnect.to/`;
    }

    const portalMatch = base.match(/https?:\/\/([^.]+)\.quickconnect\.to/i);

    if (portalMatch) {
        return `https://${portalMatch[1]}.quickconnect.to/`;
    }

    return null;
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

export function nasFileUrl(nasPath: string): string {
    return `nas:${joinNasPath(nasPath)}`;
}

export function nasPathFromStored(
    raw: string | null | undefined
): string | null {
    if (!raw?.trim()) {
        return null;
    }

    const value = raw.trim();

    if (value.startsWith("nas:")) {
        return joinNasPath(value.slice(4));
    }

    if (value.startsWith("/") && !value.startsWith("//")) {
        const root = synologyArchiveRoot();
        const parent = root.replace(/\/[^/]+$/, "") || "/mdb-pms";

        if (
            value === root
            || value.startsWith(`${root}/`)
            || value.startsWith(`${parent}/`)
            || value.startsWith("/mdb-pms/")
        ) {
            return value;
        }
    }

    return null;
}

export function isNasConfigured(): boolean {
    return isNasArchiveEnabled() && Boolean(synologyCredentials());
}
