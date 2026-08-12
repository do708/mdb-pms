import https from "node:https";

import {
    joinNasPath,
    synologyArchiveRoot,
    synologyBaseUrl,
    synologyCredentials,
    synologyQuickConnectReferer,
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

function synoRequestHeaders(init?: RequestInit): Headers {
    const headers = new Headers(init?.headers);
    const referer = synologyQuickConnectReferer();

    if (referer && !headers.has("Referer")) {
        headers.set("Referer", referer);
    }

    if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "mdb-pms/1.0");
    }

    return headers;
}

async function synoFetch(
    url: string,
    init?: RequestInit
): Promise<Response> {
    const requestInit: RequestInit = {
        ...init,
        headers: synoRequestHeaders(init),
    };

    if (verifySsl()) {
        return fetch(url, requestInit);
    }

    const agent = new https.Agent({ rejectUnauthorized: false });

    return fetch(url, {
        ...requestInit,
        // @ts-expect-error Node fetch agent
        agent,
    });
}

async function parseSynoResponse(response: Response): Promise<SynoResponse> {
    const text = await response.text();

    if (!text.trimStart().startsWith("{")) {
        const titleMatch = text.match(/<title>([^<]+)/i);
        const title = titleMatch?.[1]?.trim();

        if (title?.includes("Unable to connect QuickConnect")) {
            throw new Error(
                "QuickConnect-relay bereikt de NAS niet (NAS offline of relay niet beschikbaar)"
            );
        }

        if (title) {
            throw new Error(`Synology gaf HTML terug (${title})`);
        }

        throw new Error("Synology gaf geen JSON terug (QuickConnect-portaal?)");
    }

    return JSON.parse(text) as SynoResponse;
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

    const json = await parseSynoResponse(response);

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
        version: "6",
        method: "login",
        account: creds.username,
        passwd: creds.password,
        session: "FileStation",
        format: "sid",
    }).toString();

    const response = await synoFetch(`${base}/webapi/entry.cgi?${query}`);

    if (!response.ok) {
        throw new Error(`Synology login HTTP ${response.status}`);
    }

    const json = await parseSynoResponse(response);

    if (!json.success || typeof json.data?.sid !== "string") {
        const code = json.error?.code;

        if (code === 407) {
            throw new Error(
                "Synology login geblokkeerd (407): IP deblokkeren in DSM → Beveiliging → Auto Block"
            );
        }

        throw new Error(
            code
                ? `Synology login mislukt (${code})`
                : "Synology login mislukt"
        );
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

    const base = synologyBaseUrl();
    const blob = new Blob([new Uint8Array(buffer)], { type: contentType });

    async function doUpload(sid: string): Promise<SynoResponse> {
        const form = new FormData();

        form.append("api", "SYNO.FileStation.Upload");
        form.append("version", "2");
        form.append("method", "upload");
        form.append("path", destFolder);
        form.append("create_parents", "true");
        form.append("overwrite", "true");
        form.append("file", blob, filename);

        // QuickConnect: _sid in multipart-body wordt genegeerd → query-string
        const response = await synoFetch(
            `${base}/webapi/entry.cgi?_sid=${encodeURIComponent(sid)}`,
            {
                method: "POST",
                body: form,
            }
        );

        if (!response.ok) {
            throw new Error(`Synology upload HTTP ${response.status}`);
        }

        return parseSynoResponse(response);
    }

    let json = await doUpload(await login());

    if (!json.success && (json.error?.code === 119 || json.error?.code === 106)) {
        cachedSid = null;
        sidExpiresAt = 0;
        json = await doUpload(await login());
    }

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
