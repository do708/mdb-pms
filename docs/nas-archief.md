# NAS-archief (Synology / mount)

Archiefmappen in PMS schrijven naar en lezen van de NAS, zodat Dominic
PDF’s, ZIP’s en correspondentie direct vanaf de share kan openen.

## Secrets / env

| Variabele | Verplicht | Doel |
|-----------|-----------|------|
| `STORAGE_ARCHIVE_ENABLED` | ja (`true`) | Archief-opslag aanzetten |
| `SYNO_USERNAME` | voor API-modus | Synology-account |
| `SYNO_PASSWORD` | voor API-modus | Synology-wachtwoord (**secret**) |
| `SYNO_BASE_URL` | optioneel | QuickConnect/DSM-URL |
| `SYNO_ARCHIVE_ROOT` | optioneel | Logisch NAS-pad, default `/mdb-pms/archief` |
| `SYNO_VERIFY_SSL` | optioneel | `false` alleen bij self-signed |
| `NAS_MOUNT_PATH` | voor mount-modus | Lokale mount van `SYNO_ARCHIVE_ROOT` |
| `ARCHIVE_FS_ROOT` | alias | Zelfde als `NAS_MOUNT_PATH` |

Zet Synology-credentials in Vercel/omgevingssecrets; commit ze nooit.

## Opslagmodus

1. **Synology FileStation** — als username/password gezet zijn.
2. **Lokale mount / mock** — anders, via `NAS_MOUNT_PATH` (productie-SMB) of
   in development default `.data/nas-archief`.

## Gedrag

- Map aanmaken in **Archief** → map op NAS + DB.
- Mappen op de NAS verschijnen in **sidebar → Archief** (sync bij laden).
- Zelfgemaakte/lege archiefmappen en mappen met uploads zijn verwijderbaar.
  Opdrachten blijven in de virtuele boom bestaan.
- Bij **opdracht voltooid** (monteur rondt af) en bij **gefactureerd** gaan
  PDF, foto’s-ZIP, intake en correspondentie naar de NAS-map van die klus.
