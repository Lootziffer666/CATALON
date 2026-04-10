import { NextRequest, NextResponse } from "next/server";
import { execute, type ExecuteParams } from "@/app/actions/execute";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExecuteParams;

    if (!body.filePath || !body.content || !body.mode) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: filePath, content, mode" },
        { status: 400 }
      );
    }

    if (!["write", "docker"].includes(body.mode)) {
      return NextResponse.json(
        { success: false, message: "Invalid mode. Must be 'write' or 'docker'." },
        { status: 400 }
      );
    }

    const result = await execute(body);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, message: detail },
      { status: 500 }
    );
  }
}
