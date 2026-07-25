import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireApiUser } from "@/lib/auth/guard";

import {
    onlyArchivedWorkorders,
    onlyArchivedForms
} from "@/lib/archive";



// Doorzoekbaar archief van afgeronde werkbonnen en oudere formulieren.
// Filters (querystring): q (tekst), customer, engineer, from, to, type.

export async function GET(
    request:NextRequest
){


    const guard =
        await requireApiUser();


    if(!guard.ok){

        return guard.response;

    }


    try {


        const { searchParams } =
            new URL(request.url);


        const q =
            searchParams.get("q")?.trim() ?? "";

        const customer =
            searchParams.get("customer")?.trim() ?? "";

        const engineer =
            searchParams.get("engineer")?.trim() ?? "";

        const from =
            searchParams.get("from")?.trim() ?? "";

        const to =
            searchParams.get("to")?.trim() ?? "";

        const type =
            searchParams.get("type")?.trim() ?? "";


        const isEngineer =
            guard.user.role === "engineer";




        // ---------- Werkbonnen ----------

        const workorderFilters:object[] = [
            onlyArchivedWorkorders()
        ];


        if(isEngineer){
            workorderFilters.push({
                assignedUserId:guard.user.id
            });
        }


        if(q){
            workorderFilters.push({
                OR:[
                    { title:{ contains:q, mode:"insensitive" } },
                    { number:{ contains:q, mode:"insensitive" } }
                ]
            });
        }


        if(customer){
            workorderFilters.push({
                OR:[
                    { customer:{ name:{ contains:customer, mode:"insensitive" } } },
                    { project:{ customer:{ name:{ contains:customer, mode:"insensitive" } } } }
                ]
            });
        }


        if(engineer){
            workorderFilters.push({
                assignedUser:{
                    name:{ contains:engineer, mode:"insensitive" }
                }
            });
        }


        if(from || to){
            const range:{ gte?:Date; lte?:Date } = {};
            if(from){ range.gte = new Date(from); }
            if(to){
                const end = new Date(to);
                end.setHours(23,59,59,999);
                range.lte = end;
            }
            workorderFilters.push({
                plannedDate:range
            });
        }




        const workorders =
            type === "formulier"
            ?
            []
            :
            await prisma.workorder.findMany({

                where:{
                    AND:workorderFilters
                },

                orderBy:{
                    updatedAt:"desc"
                },

                include:{
                    customer:true,
                    project:{
                        include:{ customer:true }
                    },
                    assignedUser:true
                },

                take:200

            });




        // ---------- Formulieren ----------

        const formFilters:object[] = [
            onlyArchivedForms()
        ];


        if(isEngineer){
            formFilters.push({
                userId:guard.user.id
            });
        }


        if(q){
            formFilters.push({
                title:{ contains:q, mode:"insensitive" }
            });
        }


        // Monteur-filter op formulieren: op de indiener
        if(engineer){
            formFilters.push({
                user:{
                    name:{ contains:engineer, mode:"insensitive" }
                }
            });
        }


        if(from || to){
            const range:{ gte?:Date; lte?:Date } = {};
            if(from){ range.gte = new Date(from); }
            if(to){
                const end = new Date(to);
                end.setHours(23,59,59,999);
                range.lte = end;
            }
            formFilters.push({
                createdAt:range
            });
        }




        // Als er op opdrachtgever gefilterd wordt, tonen we geen
        // formulieren (die hebben geen opdrachtgever).
        const forms =
            (type === "werkbon" || customer)
            ?
            []
            :
            await prisma.formSubmission.findMany({

                where:{
                    AND:formFilters
                },

                orderBy:{
                    createdAt:"desc"
                },

                include:{
                    user:{
                        select:{ name:true }
                    }
                },

                take:200

            });




        return NextResponse.json({
            workorders,
            forms
        });


    } catch(error){


        console.error(
            "ARCHIVE ERROR",
            error
        );


        return NextResponse.json(

            {
                error:"Archief ophalen mislukt"
            },

            {
                status:500
            }

        );


    }


}
