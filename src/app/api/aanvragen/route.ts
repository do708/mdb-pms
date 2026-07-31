import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth/guard";



// Lijst van openstaande aanvragen (voor het dashboard). Alleen office/admin.
export async function GET(){

    try {

        const guard =
            await requireApiRole(["admin", "office"]);

        if(!guard.ok){
            return guard.response;
        }


        const aanvragen =
            await prisma.aanvraag.findMany({
                where:{
                    status:"open"
                },
                include:{
                    customer:{
                        select:{ name:true }
                    }
                },
                orderBy:{
                    createdAt:"desc"
                }
            });


        return NextResponse.json({ aanvragen });

    } catch(error){

        console.error("AANVRAGEN LIST ERROR", error);

        return NextResponse.json(
            { error:"Kon aanvragen niet laden" },
            { status:500 }
        );

    }

}
