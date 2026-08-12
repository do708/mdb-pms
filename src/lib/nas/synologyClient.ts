import https from "node:https";

import {
    joinNasPath,
    synologyArchiveRoot,
    synologyBaseUrl,
    synologyCredentials,
} from "@/lib/nas/synologyConfig";

type SynoResponse = {
    success: boolean;
    error?: { code?: number };
    data?: Record<string, unknown>;
};

let cachedSid: string | null = null;
let sidExpiresAt = 0;

function verifySsl(): boolean {
    return process.env.SYNO_VERIFY_SSL !== "false";
}

async function synoFetch(
    url: string,
    init?: RequestInit
): Promise<Response> {
    if (verifySsl()) {
        return fetch(url, init);
    }

    const agent = new https.Agent({ rejectUnauthorized: false });

    return fetch(url, {
        ...init,
        // @ts-expect-error Node fetch agent
        agent,
    });
}

async function synoApi(
    params: Record<string, string>,
    init?: RequestInit
): Promise<SynoResponse> {
    const base = synologyBaseUrl();
    const query = new URLSearchParams(params).toString();
    const url = `${base}/webapi/entry.cgi?${query}`;

    const response = await synoFetch(url, init);

    if (!response.ok) {
        throw new Error(`Synology HTTP ${response.status}`);
    }

    const json = (await response.json()) as SynoResponse;

    if (!json.success) {
        const code = json.error?.code ?? "unknown";
        throw new Error(`Synology API-fout (${code})`);
    }

    return json;
}

async function login(): Promise<string> {
    if (cachedSid && Date.now() < sidExpiresAt) {
        return cachedSid;
    }

    const creds = synologyCredentials();

    if (!creds) {
        throw new Error("SYNO_USERNAME / SYNO_PASSWORD ontbreken");
    }

    const base = synologyBaseUrl();
    const query = new URLSearchParams({
        api: "SYNO.API.Auth",
        version: "7",
        method: "login",
        account: creds.username,
        passwd: creds.password,
        session: "FileStation",
        format: "sid",
    }).toString();

    const response = await synoFetch(`${base}/webapi/auth.cgi?${query}`);

    if (!response.ok) {
        throw new Error(`Synology login HTTP ${response.status}`);
    }

    const json = (await response.json()) as SynoResponse;

    if (!json.success || typeof json.data?.sid !== "string") {
        throw new Error("Synology login mislukt");
    }

    cachedSid = json.data.sid;
    sidExpiresAt = Date.now() + 25 * 60 * 1000;

    return cachedSid;
}

async function withSid(
    params: Record<string, string>,
    init?: RequestInit
): Promise<SynoResponse> {
    const sid = await login();

    try {
        return await synoApi({ ...params, _sid: sid }, init);
    } catch (error) {
        cachedSid = null;
        sidExpiresAt = 0;

        const message = error instanceof Error ? error.message : "";

        if (message.includes("119") || message.includes("106")) {
            const retrySid = await login();
            return synoApi({ ...params, _sid: retrySid }, init);
        }

        throw error;
    }
}

/** Maakt map op NAS (inclusief parents indien nodig). */
export async function synologyEnsureFolder(nasPath: string): Promise<void> {
    const parts = joinNasPath(nasPath).split("/").filter(Boolean);

    if (parts.length === 0) {
        return;
    }

    let parent = "/";

    for (const name of parts) {
        try {
            await withSid({
                api: "SYNO.FileStation.CreateFolder",
                version: "2",
                method: "create",
                folder_path: JSON.stringify([parent]),
                name,
                force_parent: "true",
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "";

            // 1100 = map bestaat al
            if (!message.includes("1100")) {
                throw error;
            }
        }

        parent = joinNasPath(parent, name);
    }
}

/** Upload bestand naar NAS-pad (map moet bestaan of wordt aangemaakt). */
export async function synologyUploadFile(
    destFolder: string,
    filename: string,
    buffer: Buffer,
    contentType = "application/octet-stream"
): Promise<string> {
    await synologyEnsureFolder(destFolder);

    const sid = await login();
    const base = synologyBaseUrl();
    const form = new FormData();

    form.append("api", "SYNO.FileStation.Upload");
    form.append("version", "2");
    form.append("method", "upload");
    form.append("path", destFolder);
    form.append("create_parents", "true");
    form.append("overwrite", "true");
    form.append("_sid", sid);
    form.append(
        "file",
        new Blob([new Uint8Array(buffer)], { type: contentType }),
        filename
    );

    const response = await synoFetch(`${base}/webapi/entry.cgi`, {
        method: "POST",
        body: form,
    });

    if (!response.ok) {
        throw new Error(`Synology upload HTTP ${response.status}`);
    }

    const json = (await response.json()) as SynoResponse;

    if (!json.success) {
        const code = json.error?.code ?? "unknown";
        throw new Error(`Synology upload mislukt (${code})`);
    }

    return joinNasPath(destFolder, filename);
}

/** Download bestand van NAS. */
export async function synologyDownloadFile(nasPath: string): Promise<Buffer> {
    const sid = await login();
    const base = synologyBaseUrl();
    const query = new URLSearchParams({
        api: "SYNO.FileStation.Download",
        version: "2",
        method: "download",
        path: JSON.stringify([nasPath]),
        mode: "download",
        _sid: sid,
    }).toString();

    const response = await synoFetch(`${base}/webapi/entry.cgi?${query}`);

    if (!response.ok) {
        throw new Error(`Synology download HTTP ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
}

export function defaultArchiveRoot(): string {
    return synologyArchiveRoot();
}
