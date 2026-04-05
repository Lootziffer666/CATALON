"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { planScopedMutation, type A2UIDocument } from "@/lib/a2ui-ssot";
import { cn } from "@/lib/utils";

interface DockerConfig {
  image?: string;
  command?: string;
  volumes?: Record<string, string>;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  mutationApplied?: boolean;
}

interface OpenHandsExecutorProps {
  document: A2UIDocument | null;
  onDocumentChange?: (next: A2UIDocument) => void;
  className?: string;
}

const scopePolicy = {
  allowedPrefixes: ["app/", "components/", "lib/"],
};

export function OpenHandsExecutor({ document, onDocumentChange, className }: OpenHandsExecutorProps) {
  const [targetPath, setTargetPath] = useState("components/generated/preview-plan.ts");
  const [message, setMessage] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<"idle" | "planning" | "executing" | "mutating">("idle");
  const [dockerConfig, setDockerConfig] = useState<DockerConfig>({
    image: "openhands/openhands:latest",
    command: "npm run build",
    volumes: { "./workspace": "/workspace" },
  });

  const canExecute = useMemo(() => Boolean(document && targetPath.trim()), [document, targetPath]);

  const handlePlan = () => {
    if (!document) {
      setMessage("No approved A2UI document available.");
      return;
    }

    try {
      setExecutionStatus("planning");
      const planned = planScopedMutation(document, targetPath, scopePolicy);
      setMessage(`Scoped plan ready: ${planned.filePath}\n\n${planned.content}`);
      setExecutionStatus("idle");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Execution gate blocked.";
      setMessage(detail);
      setExecutionStatus("idle");
    }
  };

  const handleExecute = async () => {
    if (!document) return;

    setExecutionStatus("executing");
    setMessage("Executing in Docker container...");

    try {
      const planned = planScopedMutation(document, targetPath, scopePolicy);
      
      const response = await fetch("/api/openhands/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plannedMutation: planned,
          dockerConfig,
        }),
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const result: ExecutionResult = await response.json();

      if (result.success) {
        setMessage(`Execution completed successfully.\n\nOutput:\n${result.output || "No output"}`);
      } else {
        setMessage(`Execution failed:\n${result.error || "Unknown error"}`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Execution failed.";
      setMessage(detail);
    } finally {
      setExecutionStatus("idle");
    }
  };

  const handleSelfMutation = () => {
    if (!document) {
      setMessage("No approved A2UI document available.");
      return;
    }

    setExecutionStatus("mutating");

    try {
      const planned = planScopedMutation(document, targetPath, scopePolicy);
      
      const mutatedDoc: A2UIDocument = {
        ...document,
        sourcePrompt: `${document.sourcePrompt} (executed at ${new Date().toISOString()})`,
      };

      onDocumentChange?.(mutatedDoc);
      setMessage(`Self-mutation applied. Document updated with execution metadata.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Self-mutation failed.";
      setMessage(detail);
    } finally {
      setExecutionStatus("idle");
    }
  };

  const isRunning = executionStatus !== "idle";

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">OpenHands Executor</h2>
        <p className="text-sm text-muted-foreground">
          Validates A2UI JSON + scoped path → file mutation plan → Docker execution → self-mutation.
        </p>
      </header>

      <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Target Path:</label>
          <input
            value={targetPath}
            onChange={(event) => setTargetPath(event.target.value)}
            className="flex-1 rounded-md border border-input px-3 py-1.5 text-sm"
            disabled={isRunning}
          />
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Docker Configuration</summary>
          <div className="mt-2 space-y-2 pl-2">
            <div className="flex items-center gap-2">
              <label className="text-xs">Image:</label>
              <input
                value={dockerConfig.image || ""}
                onChange={(e) => setDockerConfig(prev => ({ ...prev, image: e.target.value }))}
                className="flex-1 rounded-md border border-input px-2 py-1 text-xs"
                placeholder="openhands/openhands:latest"
                disabled={isRunning}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs">Command:</label>
              <input
                value={dockerConfig.command || ""}
                onChange={(e) => setDockerConfig(prev => ({ ...prev, command: e.target.value }))}
                className="flex-1 rounded-md border border-input px-2 py-1 text-xs"
                placeholder="npm run build"
                disabled={isRunning}
              />
            </div>
          </div>
        </details>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handlePlan} disabled={!canExecute || isRunning}>
          Validate Scope
        </Button>
        <Button onClick={handleExecute} disabled={!canExecute || isRunning} variant="secondary">
          Execute in Docker
        </Button>
        <Button onClick={handleSelfMutation} disabled={!document || isRunning} variant="outline">
          Apply Self-Mutation
        </Button>
      </div>

      {message && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <pre className="whitespace-pre-wrap text-xs font-muted text-muted-foreground">{message}</pre>
        </div>
      )}

      {executionStatus !== "idle" && (
        <div className="flex items-center gap-2 text-sm">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Status: {executionStatus}...</span>
        </div>
      )}
    </section>
  );
}
