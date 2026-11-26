import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString =
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/mdb_pms";

const adapter = new PrismaPg({
    connectionString,
});

const prisma = new PrismaClient({
    adapter,
});

type SeedUser = {
    name: string;
    email: string;
    role: string;
    gereedschapBeheer: boolean;
    keurmeester: boolean;
    overzichtAlleAssets: boolean;
};

const DEMO_USERS: SeedUser[] = [
    {
        name: "Dominic de Beer",
        email: "dominic@mdb-networks.nl",
        role: "admin",
        gereedschapBeheer: true,
        keurmeester: true,
        overzichtAlleAssets: true,
    },
    {
        name: "Linda",
        email: "linda@mdb-networks.nl",
        role: "office",
        gereedschapBeheer: true,
        keurmeester: true,
        overzichtAlleAssets: true,
    },
    {
        name: "Michel",
        email: "michel@mdb-networks.nl",
        role: "office",
        gereedschapBeheer: false,
        keurmeester: false,
        overzichtAlleAssets: true,
    },
];

async function main() {
    const password = await bcrypt.hash("Admin123!", 10);

    await prisma.user.upsert({
        where: { email: "admin@mdb-networks.nl" },
        update: {},
        create: {
            name: "Administrator",
            email: "admin@mdb-networks.nl",
            password,
            role: "admin",
            gereedschapBeheer: true,
            keurmeester: true,
            overzichtAlleAssets: true,
        },
    });

    console.log("✓ Admin user created");

    for (const u of DEMO_USERS) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                name: u.name,
                role: u.role,
                gereedschapBeheer: u.gereedschapBeheer,
                keurmeester: u.keurmeester,
                overzichtAlleAssets: u.overzichtAlleAssets,
                active: true,
            },
            create: {
                name: u.name,
                email: u.email,
                password,
                role: u.role,
                gereedschapBeheer: u.gereedschapBeheer,
                keurmeester: u.keurmeester,
                overzichtAlleAssets: u.overzichtAlleAssets,
                active: true,
            },
        });
        console.log(`✓ Seed user ${u.email}`);
    }

    for (const category of ["G", "L", "T", "E", "M"]) {
        await prisma.toolIdSequence.upsert({
            where: { category },
            update: {},
            create: { category, nextValue: 1 },
        });
    }
    console.log("✓ Tool ID sequences ready");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
