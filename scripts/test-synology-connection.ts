/**
 * Test NAS-verbinding (File Station API). Geen secrets loggen.
 * Gebruik: npx tsx scripts/test-synology-connection.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import {
    synologyEnsureFolder,
    synologyUploadFile,
    defaultArchiveRoot,
} from "../src/lib/nas/synologyClient";
import { synologyBaseUrl, synologyCredentials } from "../src/lib/nas/synologyConfig";

async function main() {
    const creds = synologyCredentials();

    if (!creds) {
        throw new Error("SYNO_USERNAME / SYNO_PASSWORD ontbreken in .env.local");
    }

    const root = defaultArchiveRoot();
    const probeDir = `${root}/.pms-probe`;
    const probeFile = `probe-${Date.now()}.txt`;

    console.log("NAS-probe:", synologyBaseUrl(), "als", creds.username);
    console.log("Login + map + upload…");

    await synologyEnsureFolder(probeDir);

    const path = await synologyUploadFile(
        probeDir,
        probeFile,
        Buffer.from("mdb-pms NAS OK", "utf8"),
        "text/plain"
    );

    console.log("OK — bestand geüpload naar:", path);
}

main().catch((error) => {
    console.error("NAS-probe MISLUKT:", error instanceof Error ? error.message : error);
    process.exit(1);
});
