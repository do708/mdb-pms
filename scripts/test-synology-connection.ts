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

async function main() {
    const root = defaultArchiveRoot();
    const probeDir = `${root}/.pms-probe`;
    const probeFile = `probe-${Date.now()}.txt`;

    console.log("NAS-probe: login + map + upload…");

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
