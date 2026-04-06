"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  planScopedMutation,
  type A2UIDocument,
  type PlannedFileMutation,
} from "@/lib/a2ui-ssot";

interface OpenHandsExecutorProps {
  document: A2UIDocument | null;
  className?: string;
}

const scopePolicy = {
  allowedPrefixes: ["app/", "components/", "lib/", "src/"],
};

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

export function OpenHandsExecutor({ document, className }: OpenHandsExecutorProps) {
  const [targetPath, setTargetPath] = useState("components/generated/preview-plan.ts");
  const [message, setMessage] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const canExecute = useMemo(
    () => Boolean(document && targetPath.trim()),
    [document, targetPath]
  );

  const handlePlan = () => {
    if (!document) {
      setMessage("No approved A2UI document available.");
      return;
    }

    try {
      const planned = planScopedMutation(document, targetPath, scopePolicy);
      setMessage(`Scoped plan ready: ${planned.filePath}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Execution gate blocked.";
      setMessage(detail);
    }
  };

  const handleWrite = async () => {
    if (!document) {
      setMessage("No approved A2UI document available.");
      return;
    }

    try {
      setIsExecuting(true);
      const planned = planScopedMutation(document, targetPath, scopePolicy);

      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: planned.filePath,
          content: planned.content,
          mode: "write",
        }),
      });

      const result = await response.json();
      setExecutionResult(result);

      if (result.success) {
        setMessage(`Written to: ${planned.filePath}`);
      } else {
        setMessage(`Write failed: ${result.error}`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Write failed";
      setMessage(detail);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDockerExecute = async () => {
    if (!document) {
      setMessage("No approved A2UI document available.");
      return;
    }

    try {
      setIsExecuting(true);
      const planned = planScopedMutation(document, targetPath, scopePolicy);

      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: planned.filePath,
          content: planned.content,
          mode: "docker",
        }),
      });

      const result = await response.json();
      setExecutionResult(result);

      if (result.success) {
        setMessage("Docker execution completed");
      } else {
        setMessage(`Execution failed: ${result.error}`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Docker execution failed";
      setMessage(detail);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <section className={className}>
      <h2 className="mb-2 text-lg font-semibold">Executor Gate</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Deterministic minimal proof: only approved A2UI JSON + scoped path can create a mutation plan.
      </p>
      <div className="flex gap-2 mb-3">
        <input
          value={targetPath}
          onChange={(event) => setTargetPath(event.target.value)}
          className="flex-1 rounded-md border border-input px-3 py-2 text-sm"
          placeholder="components/generated/preview-plan.ts"
        />
      </div>
      <div className="flex gap-2 mb-3">
        <Button onClick={handlePlan} disabled={!canExecute || isExecuting}>
          Validate Scope
        </Button>
        <Button onClick={handleWrite} disabled={!canExecute || isExecuting} variant="outline">
          Write to FS
        </Button>
        <Button onClick={handleDockerExecute} disabled={!canExecute || isExecuting} variant="secondary">
          Docker Execute
        </Button>
      </div>
      {message && <p className="mt-2 text-sm">{message}</p>}
      {executionResult && (
        <div className="mt-3 p-2 rounded bg-muted text-xs font-mono overflow-x-auto">
          <div className="font-semibold mb-1">
            {executionResult.success ? "✓ Success" : "✗ Failed"}
          </div>
          <pre className="whitespace-pre-wrap">{executionResult.output || executionResult.error}</pre>
        </div>
      )}
    </section>
  );
}