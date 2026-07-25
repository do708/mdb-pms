#!/usr/bin/env node
//
// MDB PMS - oude werkbon-statussen omzetten naar de nieuwe flow.
//
// Draaien vanuit de projectroot, NA de prisma-migratie:
//   node migrate-status.mjs
//
// Zet bestaande waarden om:
//   open           -> ontvangen
//   in_uitvoering  -> ingepland
//   afgerond       -> afgerond (blijft)
//
// Veilig om vaker te draaien: alleen bekende oude waarden worden geraakt.
//
import { readFileSync, existsSync } from "node:fs";
import pg from "pg";

console.log("\nMDB PMS - statussen migreren\n");

if (!existsSync("package.json") || !existsSync(".env")) {
    console.error("FOUT: draai dit script vanuit de projectroot (met .env).");
    process.exit(1);
}

const envLine = readFileSync(".env", "utf8")
    .split("\n")
    .find((line) => line.trim().startsWith("DATABASE_URL"));

if (!envLine) {
    console.error("FOUT: DATABASE_URL niet gevonden in .env");
    process.exit(1);
}

const url = envLine
    .slice(envLine.indexOf("=") + 1)
    .trim()
    .replace(/^["']|["']$/g, "");

const client = new pg.Client({ connectionString: url });

await client.connect();

try {
    const mapping = [
        ["open", "ontvangen"],
        ["in_uitvoering", "ingepland"],
    ];

    for (const [from, to] of mapping) {
        const result = await client.query(
            `UPDATE "Workorder" SET status = $2 WHERE status = $1`,
            [from, to]
        );
        console.log(`  ${from} -> ${to}: ${result.rowCount} werkbon(nen)`);
    }

    // Werkbonnen zonder klant maar met project: klant overnemen van project
    const linked = await client.query(
        `UPDATE "Workorder" w
         SET "customerId" = p."customerId"
         FROM "Project" p
         WHERE w."projectId" = p.id
           AND w."customerId" IS NULL`
    );
    console.log(`  klant overgenomen van project: ${linked.rowCount} werkbon(nen)`);
} finally {
    await client.end();
}

console.log("\nKlaar.\n");
