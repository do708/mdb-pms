#!/usr/bin/env bash
# Dump de live Postgres (DIRECT_URL in .env) naar backups/.
# Gebruik: ./scripts/backup-database.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Geen .env gevonden." >&2
  exit 1
fi

URL="$(python3 - <<'PY'
from pathlib import Path
for line in Path(".env").read_text().splitlines():
    s = line.strip()
    if s.startswith("DIRECT_URL="):
        print(s.split("=", 1)[1].strip().strip('"').strip("'"))
        break
PY
)"

if [[ -z "${URL}" ]]; then
  echo "DIRECT_URL ontbreekt in .env." >&2
  exit 1
fi

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="backups/mdb-pms-${STAMP}.sql"

PG_DUMP="pg_dump"
for candidate in \
  "/usr/local/opt/postgresql@17/bin/pg_dump" \
  "/opt/homebrew/opt/postgresql@17/bin/pg_dump"
do
  if [[ -x "${candidate}" ]]; then
    PG_DUMP="${candidate}"
    break
  fi
done

echo "Database dump naar ${OUT} …"
"${PG_DUMP}" --no-owner --no-acl --format=plain --file="${OUT}" "${URL}"
gzip -f "${OUT}"
echo "Klaar: ${OUT}.gz"
ls -lh "${OUT}.gz"
