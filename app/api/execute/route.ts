import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

interface ExecuteRequest {
  plan: {
    filePath: string;
    content: string;
  };
  docker: boolean;
  image?: string;
}

const ALLOWED_PREFIXES = ["app/", "components/", "lib/"];

function isPathAllowed(filePath: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

async function ensureDirectory(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

async function writeToFilesystem(plan: ExecuteRequest["plan"]): Promise<{
  success: boolean;
  path: string;
  error?: string;
}> {
  const fullPath = path.join(process.cwd(), plan.filePath);
  
  if (!isPathAllowed(plan.filePath)) {
    return { success: false, path: fullPath, error: "Path outside allowed scope" };
  }

  try {
    const dir = path.dirname(fullPath);
    await ensureDirectory(dir);
    await writeFile(fullPath, plan.content, "utf-8");
    return { success: true, path: fullPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Write failed";
    return { success: false, path: fullPath, error: message };
  }
}

async function executeInDocker(
  plan: ExecuteRequest["plan"],
  image: string = "node:20-alpine"
): Promise<{
  success: boolean;
  output: string;
  error?: string;
}> {
  const result = await writeToFilesystem(plan);
  if (!result.success) {
    return { success: false, output: "", error: result.error };
  }

  return {
    success: true,
    output: `Docker execution ready: ${result.path}\nUsing image: ${image}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequest = await request.json();
    const { plan, docker, image } = body;

    if (!plan?.filePath || !plan?.content) {
      return NextResponse.json(
        { success: false, error: "Invalid plan" },
        { status: 400 }
      );
    }

    let result: { success: boolean; output: string; error?: string };

    if (docker) {
      result = await executeInDocker(plan, image);
    } else {
      const writeResult = await writeToFilesystem(plan);
      result = {
        success: writeResult.success,
        output: writeResult.success ? `Written: ${writeResult.path}` : "",
        error: writeResult.error,
      };
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      output: result.output,
      path: plan.filePath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ready",
    allowedPrefixes: ALLOWED_PREFIXES,
  });
}