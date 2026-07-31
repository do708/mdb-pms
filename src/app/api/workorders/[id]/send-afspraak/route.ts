import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";
import { customerName, resolveCustomer } from "@/lib/workorderCustomer";
import { sendAfspraakMail } from "@/lib/email/sendAfspraakMail";



export async function POST(
    request: NextRequest,
    context:{
        params:Promise<{ id:string }>
    }
){

    try {

        // Alleen kantoor/admin mag afspraken versturen.
        const guard =
            await requireApiRole(["admin","office"]);

        if(!guard.ok){
            return guard.response;
        }


        const { id } =
            await context.params;


        const workorder =
            await prisma.workorder.findUnique({
                where:{ id },
                include:{
                    customer:true,
                    project:{
                        include:{ customer:true }
                    }
                }
            });

        if(!workorder){
            return NextResponse.json(
                { error:"Werkbon niet gevonden" },
                { status:404 }
            );
        }


        // Mogelijke overrides vanuit het scherm (allemaal optioneel).
        const body =
            await request.json().catch(()=>({}));


        const klant =
            customerName(workorder);

        const klantObj =
            resolveCustomer(workorder);


        const ontvanger =
            (body.to && String(body.to).trim())
            || workorder.contactEmail
            || klantObj?.email
            || "";

        if(!ontvanger){
            return NextResponse.json(
                { error:"Geen e-mailadres bekend. Vul een contactpersoon met e-mailadres in op de werkbon, of een e-mailadres bij de klant." },
                { status:400 }
            );
        }


        // Locatie = de projectnaam. In dit systeem staat de projectnaam in het
        // veld "title" van de werkbon (het "Projectnaam:"-veld op het
        // aanmaakscherm). Valt terug op een gekoppeld project of de klantnaam.
        const locatie =
            (body.locatie && String(body.locatie).trim())
            || workorder.title
            || workorder.project?.name
            || klant;


        const datum =
            (body.datum && String(body.datum).trim())
            || (
                workorder.plannedDate
                ?
                new Date(workorder.plannedDate).toLocaleDateString("nl-NL",{
                    weekday:"long",
                    day:"numeric",
                    month:"long",
                    year:"numeric"
                })
                :
                "nader te bepalen"
            );


        // Aanvang = van-tot uit de geplande begin-/eindtijd.
        function tijd(d:Date):string {
            return d.toLocaleTimeString("nl-NL",{
                hour:"2-digit",
                minute:"2-digit"
            });
        }

        let aanvang =
            (body.aanvang && String(body.aanvang).trim()) || "";

        if(!aanvang && workorder.plannedDate){

            const start =
                new Date(workorder.plannedDate);

            const heeftStartTijd =
                start.getHours() !== 0 || start.getMinutes() !== 0;

            if(heeftStartTijd){

                aanvang = tijd(start);

                if(workorder.plannedEndDate){
                    const eind = new Date(workorder.plannedEndDate);
                    const heeftEindTijd =
                        eind.getHours() !== 0 || eind.getMinutes() !== 0;
                    if(heeftEindTijd){
                        aanvang = `${tijd(start)} - ${tijd(eind)} uur`;
                    }
                }

            }

        }

        if(!aanvang){
            aanvang = "nader te bepalen";
        }


        await sendAfspraakMail({

            to:
                ontvanger,

            contactpersoon:
                (body.contactpersoon && String(body.contactpersoon).trim())
                || workorder.contactPersoon
                || "",

            klant:
                klant,

            werkzaamheden:
                (body.werkzaamheden && String(body.werkzaamheden).trim())
                || workorder.description
                || workorder.title,

            locatie:
                locatie,

            datum:
                datum,

            aanvang:
                aanvang

        });


        // Status naar "afspraak" (Afspraak verstuurd) zetten.
        await prisma.workorder.update({
            where:{ id },
            data:{ status:"afspraak" }
        });


        return NextResponse.json({ ok:true });

    } catch(error){

        console.error("SEND AFSPRAAK ERROR:", error);

        return NextResponse.json(
            { error:"Afspraak versturen mislukt" },
            { status:500 }
        );

    }

}
