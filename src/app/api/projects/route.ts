import { NextResponse } from "next/server";


export async function GET() {

    return NextResponse.json({

        module: "projects",

        status: "ok",

        message:
            "projects API actief"

    });

}


export async function POST(
    request: Request
) {

    const body = await request.json();


    return NextResponse.json({

        module: "projects",

        received: body

    });

}