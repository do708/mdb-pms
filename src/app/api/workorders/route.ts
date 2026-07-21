import { NextResponse } from "next/server";


export async function GET() {

    return NextResponse.json({

        module: "workorders",

        status: "ok",

        message:
            "workorders API actief"

    });

}


export async function POST(
    request: Request
) {

    const body = await request.json();


    return NextResponse.json({

        module: "workorders",

        received: body

    });

}