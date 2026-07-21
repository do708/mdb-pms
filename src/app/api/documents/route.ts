import { NextResponse } from "next/server";


export async function GET() {

    return NextResponse.json({

        module: "documents",

        status: "ok",

        message:
            "documents API actief"

    });

}


export async function POST(
    request: Request
) {

    const body = await request.json();


    return NextResponse.json({

        module: "documents",

        received: body

    });

}