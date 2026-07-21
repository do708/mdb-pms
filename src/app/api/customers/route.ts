import { NextResponse } from "next/server";


export async function GET() {

    return NextResponse.json({

        module: "customers",

        status: "ok",

        message:
            "customers API actief"

    });

}


export async function POST(
    request: Request
) {

    const body = await request.json();


    return NextResponse.json({

        module: "customers",

        received: body

    });

}