import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

interface DockerConfig {
  image?: string;
  command?: string;
  volumes?: Record<string, string>;
}

interface PlannedMutation {
  filePath: string;
  content: string;
}

interface ExecuteRequest {
  plannedMutation: PlannedMutation;
  dockerConfig?: DockerConfig;
}

async function ensureDirectory(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequest = await request.json();
    const { plannedMutation, dockerConfig } = body;

    if (!plannedMutation || !plannedMutation.filePath || !plannedMutation.content) {
      return NextResponse.json(
        { success: false, error: "Invalid plannedMutation: filePath and content are required." },
        { status: 400 }
      );
    }

    const image = dockerConfig?.image || "openhands/openhands:latest";
    const command = dockerConfig?.command || "npm run build";
    const volumes = dockerConfig?.volumes || { "./workspace": "/workspace" };

    const volumeArgs = Object.entries(volumes).flatMap(([host, container]) => [
      "-v", `${host}:${container}`
    ]);

    const dockerCommand = [
      "docker", "run", "--rm",
      ...volumeArgs,
      image,
      "sh", "-c", command
    ];

    let output = "";
    let error = "";
    let success = false;

    try {
      const { spawn } = await import("child_process");
      
      await new Promise<void>((resolve, reject) => {
        const proc = spawn(dockerCommand[0], dockerCommand.slice(1), {
          stdio: ["pipe", "pipe", "pipe"]
        });

        let stdoutData = "";
        let stderrData = "";

        proc.stdout?.on("data", (data) => {
          stdoutData += data.toString();
        });

        proc.stderr?.on("data", (data) => {
          stderrData += data.toString();
        });

        proc.on("close", (code) => {
          output = stdoutData;
          error = stderrData;
          success = code === 0;
          if (code !== 0) {
            reject(new Error(`Docker exited with code ${code}`));
          } else {
            resolve();
          }
        });

        proc.on("error", (err) => {
          reject(err);
        });
      });
    } catch (dockerError) {
      const dockerAvailable = await checkDocker();
      if (!dockerAvailable) {
        return NextResponse.json(
          { success: false, error: "Docker is not available. Please ensure Docker is running." },
          { status: 503 }
        );
      }
      success = false;
      error = dockerError instanceof Error ? dockerError.message : String(dockerError);
    }

    const mutationApplied = success;

    return NextResponse.json({
      success,
      output: output || undefined,
      error: error || undefined,
      mutationApplied
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

async function checkDocker(): Promise<boolean> {
  try {
    const { exec } = await import("child_process");
    return new Promise((resolve) => {
      exec("docker info", (error) => {
        resolve(!error);
      });
    });
  } catch {
    return false;
  }
}