import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";


const connectionString =
    process.env.DATABASE_URL
    ?? "postgresql://postgres:postgres@localhost:5432/mdb_pms";

const adapter = new PrismaPg({
    connectionString,
});


const prisma = new PrismaClient({
    adapter,
});


async function main() {

    const password = await bcrypt.hash(
        "Admin123!",
        10
    );


    await prisma.user.upsert({

        where: {
            email: "admin@mdb-networks.nl",
        },

        update: {},

        create: {

            name: "Administrator",

            email: "admin@mdb-networks.nl",

            password,

            role: "admin",

        },

    });


    console.log(
        "✓ Admin user created"
    );

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