"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { planScopedMutation, type A2UIDocument } from "@/lib/a2ui-ssot";
import { cn } from "@/lib/utils";

interface OpenHandsExecutorProps {
  document: A2UIDocument | null;
  className?: string;
  onMutationComplete?: (path: string, content: string) => void;
  onSelfMutate?: (path: string, newContent: string) => void;
}

const scopePolicy = {
  allowedPrefixes: ["app/", "components/", "lib/", "self:"],
};

interface ExecutionResult {
  success: boolean;
  output: string;
  path?: string;
  error?: string;
}

interface ExecutionRecord {
  path: string;
  content: string;
  timestamp: number;
  success: boolean;
}

export function OpenHandsExecutor({ document, className, onMutationComplete, onSelfMutate }: OpenHandsExecutorProps) {
  const [targetPath, setTargetPath] = useState("components/generated/preview-plan.ts");
  const [message, setMessage] = useState<string | null>(null);
  const [useDocker, setUseDocker] = useState(false);
  const [dockerImage, setDockerImage] = useState("node:20-alpine");
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionRecord[]>([]);
  const [selfMutationEnabled, setSelfMutationEnabled] = useState(false);

  const canExecute = useMemo(() => Boolean(document && targetPath.trim()), [document, targetPath]);

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

  const handleExecute = async () => {
    if (!document) {
      setMessage("No approved A2UI document available.");
      return;
    }

    setIsExecuting(true);
    setLastResult(null);

    try {
      const planned = planScopedMutation(document, targetPath, scopePolicy);

      const isSelfMutation = targetPath.startsWith("self:") && selfMutationEnabled;

      if (isSelfMutation) {
        const selfPath = targetPath.replace("self:", "");
        const selfContent = `// Self-mutation: ${new Date().toISOString()}\n// Previous state recorded\n${planned.content}`;
        
        onSelfMutate?.(selfPath, selfContent);
        setMessage(`✓ Self-mutation applied: ${selfPath}`);
        
        const record: ExecutionRecord = {
          path: selfPath,
          content: selfContent,
          timestamp: Date.now(),
          success: true,
        };
        setExecutionHistory((prev) => [...prev.slice(-9), record]);
        
        setLastResult({ success: true, output: `Self-mutated: ${selfPath}` });
        setIsExecuting(false);
        return;
      }

      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planned,
          docker: useDocker,
          image: dockerImage,
        }),
      });

      const result: ExecutionResult = await response.json();

      setLastResult(result);

      const record: ExecutionRecord = {
        path: result.path || targetPath,
        content: planned.content,
        timestamp: Date.now(),
        success: result.success,
      };
      setExecutionHistory((prev) => [...prev.slice(-9), record]);

      if (result.success) {
        setMessage(`✓ Executed: ${result.path}`);
        onMutationComplete?.(result.path || targetPath, planned.content);
      } else {
        setMessage(`✗ Failed: ${result.error}`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Execution failed";
      setMessage(`✗ Error: ${detail}`);
      setLastResult({ success: false, output: "", error: detail });
      
      const record: ExecutionRecord = {
        path: targetPath,
        content: "",
        timestamp: Date.now(),
        success: false,
      };
      setExecutionHistory((prev) => [...prev.slice(-9), record]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Executor Gate</h2>
        <p className="text-sm text-muted-foreground">
          Deterministic minimal proof: only approved A2UI JSON + scoped path can create a mutation plan.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          value={targetPath}
          onChange={(event) => setTargetPath(event.target.value)}
          placeholder="components/generated/preview-plan.ts"
          className="flex-1 rounded-md border border-input px-3 py-2 text-sm"
        />
        <Button onClick={handlePlan} disabled={!canExecute} variant="outline">
          Validate Scope
        </Button>
      </div>

      <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useDocker}
            onChange={(e) => setUseDocker(e.target.checked)}
            className="rounded border-input"
          />
          Use Docker
        </label>
        {useDocker && (
          <input
            value={dockerImage}
            onChange={(e) => setDockerImage(e.target.value)}
            placeholder="node:20-alpine"
            className="flex-1 rounded-md border border-input px-2 py-1 text-xs"
          />
        )}
      </div>

      <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selfMutationEnabled}
            onChange={(e) => setSelfMutationEnabled(e.target.checked)}
            className="rounded border-input"
          />
          Enable Self-Mutation
        </label>
        <span className="text-xs text-muted-foreground">
          (use path: self:filename to mutate executor itself)
        </span>
      </div>

      <Button
        onClick={handleExecute}
        disabled={!canExecute || isExecuting}
        className="w-fit"
      >
        {isExecuting ? "Executing..." : "Execute Mutation"}
      </Button>

      {message && (
        <p className={cn("text-sm", lastResult?.success ? "text-green-600" : "text-red-500")}>
          {message}
        </p>
      )}

      {lastResult?.output && (
        <div className="rounded-lg border bg-muted/20 p-3">
          <h3 className="mb-1 text-xs font-medium">Execution Output</h3>
          <pre className="max-h-32 overflow-auto text-xs">{lastResult.output}</pre>
        </div>
      )}

      {executionHistory.length > 0 && (
        <div className="rounded-lg border bg-muted/20 p-3">
          <h3 className="mb-2 text-xs font-medium">Execution History</h3>
          <div className="flex flex-col gap-1">
            {executionHistory.slice().reverse().map((record, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className={cn("font-mono", record.success ? "text-green-600" : "text-red-500")}>
                  {record.path}
                </span>
                <span className="text-muted-foreground">
                  {new Date(record.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}