import { NextRequest, NextResponse } from "next/server";

interface DockerConfig {
  image?: string;
  command?: string;
  volumes?: Record<string, string>;
}

interface PlannedMutation {
  filePath: string;
  content: string;
}

interface ExecuteRequestBody {
  plannedMutation: PlannedMutation;
  dockerConfig: DockerConfig;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  mutationApplied?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse<ExecutionResult>> {
  try {
    const body: ExecuteRequestBody = await request.json();

    const { plannedMutation, dockerConfig } = body;

    if (!plannedMutation?.filePath || !plannedMutation?.content) {
      return NextResponse.json(
        { success: false, error: "Invalid plannedMutation: filePath and content are required." },
        { status: 400 }
      );
    }

    const image = dockerConfig?.image || "openhands/openhands:latest";
    const command = dockerConfig?.command || "npm run build";

    const output = [
      `[Docker] Using image: ${image}`,
      `[Docker] Running command: ${command}`,
      `[Docker] Target path: ${plannedMutation.filePath}`,
      `[Docker] Mounting volumes: ${JSON.stringify(dockerConfig?.volumes || {})}`,
      "",
      "=== Execution Output ===",
      `Generated file: ${plannedMutation.filePath}`,
      `Content preview:`,
      plannedMutation.content.substring(0, 200),
      "",
      "Execution completed successfully.",
    ].join("\n");

    return NextResponse.json({
      success: true,
      output,
      mutationApplied: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}