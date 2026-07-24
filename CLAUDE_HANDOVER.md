# MDB PMS Project Handover

## Stack
- Next.js 16.2.11
- TypeScript
- Prisma 7
- PostgreSQL
- NextAuth
- Tailwind

## Current status

Working:
- Login
- Logout
- Roles
- Admin environment
- Engineer environment
- Sidebar
- Workorders
- Projects
- Customers
- Users
- PDF endpoints
- Photos
- Hours
- Signature components

## Important issue

Prisma migration history has drift.

Do NOT use:
prisma migrate reset

Database contains existing test data.

Current migration folders:
- 20260721192712_init
- 20260721193157_add_auth
- 20260724160000_baseline_sync
- 20260724170000_baseline

Need to make Prisma migrations clean again without losing data.

## Next priorities

1. Fix Prisma migration state
2. Add internalNotes to Workorder
3. Improve engineer workflow
4. Add planning calendar
5. Add engineer planning view
6. Improve dashboard
7. Finish PDF workflow
8. Complete reports/materials/documents

## Desired workflow

Office:
Customer
→ Project
→ Planning
→ Workorder
→ Assign engineer

Engineer:
See own planning
→ Open workorder
→ Hours
→ Photos
→ Materials
→ Signature
→ Complete

