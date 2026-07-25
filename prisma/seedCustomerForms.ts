// Koppelt de vaste per-opdrachtgever formulierschema's aan de klanten.
//
// Draaien met:
//   npx tsx prisma/seedCustomerForms.ts
//
// Veilig om vaker te draaien: bestaande klanten worden bijgewerkt, en een
// klant die niet bestaat wordt overgeslagen (geen nieuwe klanten aangemaakt).

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

import { CUSTOMER_FORM_SCHEMAS } from "../src/types/customerForms";


const connectionString =
    process.env.DATABASE_URL ?? "";

const adapter =
    new PrismaPg({ connectionString });

const prisma =
    new PrismaClient({ adapter });



// Sommige klantnamen verschillen licht tussen het oude project en het onze.
// Hier leggen we die naast elkaar: onze klantnaam -> sleutel in de schema's.
const NAME_ALIASES:Record<string,string> = {
    "NDI ICT Solutions":"NDI ICT Solutions",
    "NDI ICT":"NDI ICT Solutions"
};



async function main(){

    console.log("Koppelen van formulierschema's aan klanten...\n");

    const customers =
        await prisma.customer.findMany({
            select:{ id:true, name:true }
        });

    let updated = 0;
    let skipped = 0;

    for(const [schemaName, schema] of Object.entries(CUSTOMER_FORM_SCHEMAS)){

        // Zoek de klant op naam (of via een alias)
        const target =
            customers.find(c=>{
                if(c.name === schemaName){
                    return true;
                }
                const alias = NAME_ALIASES[c.name];
                return alias === schemaName;
            });

        if(!target){
            console.log(`  overslaan  "${schemaName}" (geen klant met deze naam)`);
            skipped++;
            continue;
        }

        await prisma.customer.update({
            where:{ id:target.id },
            data:{ formSchema:schema as object }
        });

        console.log(`  ok         ${target.name}`);
        updated++;

    }

    console.log(`\nKlaar. ${updated} klant(en) bijgewerkt, ${skipped} overgeslagen.\n`);

}



main()
    .catch(e=>{
        console.error(e);
        process.exit(1);
    })
    .finally(async()=>{
        await prisma.$disconnect();
    });
