"use server";

import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

export interface ExecuteParams {
  filePath: string;
  content: string;
  mode: "write" | "docker";
}

export interface ExecuteResult {
  success: boolean;
  message: string;
  filePath?: string;
  output?: string;
}

export async function executeMutation(
  filePath: string,
  content: string
): Promise<ExecuteResult> {
  try {
    const fullPath = join(process.cwd(), filePath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(fullPath, content, "utf-8");

    return {
      success: true,
      message: `Successfully wrote to ${filePath}`,
      filePath,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      message: `Failed to write file: ${detail}`,
    };
  }
}

export async function executeInDocker(
  image: string,
  command: string
): Promise<ExecuteResult> {
  return {
    success: false,
    message: "Docker execution is not yet implemented.",
  };
}

export async function execute(params: ExecuteParams): Promise<ExecuteResult> {
  const { filePath, content, mode } = params;

  if (mode === "write") {
    return executeMutation(filePath, content);
  }

  if (mode === "docker") {
    return executeInDocker("node", content);
  }

  return {
    success: false,
    message: `Unknown mode: ${mode}`,
  };
}
