/**
 * Database-dump maken en naar de NAS zetten.
 * Gebruik: npx tsx scripts/backup-to-nas.ts
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { synologyUploadFile } from "../src/lib/nas/synologyClient";
import {
    isNasConfigured,
    joinNasPath,
    synologyArchiveRoot,
} from "../src/lib/nas/synologyConfig";

function backupsNasFolder(): string {
    const archive = synologyArchiveRoot();
    const parent = archive.replace(/\/[^/]+$/, "") || "/mdb-pms";
    return joinNasPath(parent, "backups");
}

function latestDump(dir: string): string {
    const files = readdirSync(dir)
        .filter((name) => name.endsWith(".sql.gz"))
        .map((name) => join(dir, name))
        .sort(
            (a, b) =>
                statSync(b).mtimeMs - statSync(a).mtimeMs
        );

    if (files.length === 0) {
        throw new Error("Geen .sql.gz dump gevonden in backups/");
    }

    return files[0];
}

async function main() {
    if (!isNasConfigured()) {
        throw new Error(
            "NAS is niet ingesteld (STORAGE_ARCHIVE_ENABLED / SYNO_USERNAME / SYNO_PASSWORD)"
        );
    }

    console.log("Database dump maken…");
    execFileSync(join(process.cwd(), "scripts/backup-database.sh"), {
        stdio: "inherit",
    });

    const dumpPath = latestDump(join(process.cwd(), "backups"));
    const filename = dumpPath.split("/").pop() || "mdb-pms-backup.sql.gz";
    const dest = backupsNasFolder();

    console.log("Uploaden naar NAS:", dest, "/", filename);
    const nasPath = await synologyUploadFile(
        dest,
        filename,
        readFileSync(dumpPath),
        "application/gzip"
    );
    console.log("OK — backup staat op de NAS:", nasPath);
}

main().catch((error) => {
    console.error(
        "NAS-backup MISLUKT:",
        error instanceof Error ? error.message : error
    );
    process.exit(1);
});
