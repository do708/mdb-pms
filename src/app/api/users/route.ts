import { NextResponse } from "next/server";


export async function GET() {

    return NextResponse.json({

        module: "users",

        status: "ok",

        message:
            "users API actief"

    });

}


export async function POST(
    request: Request
) {

    const body = await request.json();


    return NextResponse.json({

        module: "users",

        received: body

    });

}