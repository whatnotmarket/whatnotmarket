import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

  if (!INDEXNOW_KEY) {
    return new NextResponse("IndexNow key not configured", { status: 404 });
  }

  if (filename === `${INDEXNOW_KEY}.txt`) {
    return new NextResponse(INDEXNOW_KEY, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new NextResponse("Not found", { status: 404 });
}
