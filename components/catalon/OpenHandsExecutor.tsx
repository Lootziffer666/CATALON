"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { planScopedMutation, type A2UIDocument, type PlannedFileMutation } from "@/lib/a2ui-ssot";

interface OpenHandsExecutorProps {
  document: A2UIDocument | null;
  className?: string;
  onMutationPlanned?: (mutation: PlannedFileMutation) => void;
}

export interface ExecutorState {
  status: "idle" | "planned" | "executed" | "error";
  mutation: PlannedFileMutation | null;
  error: string | null;
}

const scopePolicy = {
  allowedPrefixes: ["app/", "components/", "lib/"],
};

const defaultTargetPath = "components/generated/preview-plan.ts";

export function OpenHandsExecutor({ document, className, onMutationPlanned }: OpenHandsExecutorProps) {
  const [targetPath, setTargetPath] = useState(defaultTargetPath);
  const [message, setMessage] = useState<string | null>(null);
  const [state, setState] = useState<ExecutorState>({
    status: "idle",
    mutation: null,
    error: null,
  });

  const canExecute = useMemo(() => Boolean(document && targetPath.trim()), [document, targetPath]);

  const handlePlan = () => {
    if (!document) {
      setMessage("No approved A2UI document available.");
      setState({ status: "error", mutation: null, error: "No document" });
      return;
    }

    try {
      const planned = planScopedMutation(document, targetPath, scopePolicy);
      setMessage(`Scoped plan ready: ${planned.filePath}`);
      setState({ status: "planned", mutation: planned, error: null });
      onMutationPlanned?.(planned);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Execution gate blocked.";
      setMessage(detail);
      setState({ status: "error", mutation: null, error: detail });
    }
  };

  const handleReset = () => {
    setTargetPath(defaultTargetPath);
    setMessage(null);
    setState({ status: "idle", mutation: null, error: null });
  };

  return (
    <section className={className}>
      <h2 className="mb-2 text-lg font-semibold">Executor Gate</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Deterministic minimal proof: only approved A2UI JSON + scoped path can create a mutation plan.
      </p>
      <div className="flex gap-2">
        <input
          value={targetPath}
          onChange={(event) => setTargetPath(event.target.value)}
          className="flex-1 rounded-md border border-input px-3 py-2 text-sm"
          placeholder="components/generated/file.ts"
        />
        <Button onClick={handlePlan} disabled={!canExecute}>
          Validate Scope
        </Button>
      </div>
      {message && <p className="mt-2 text-sm">{message}</p>}
      {state.status === "planned" && state.mutation && (
        <div className="mt-3 rounded-lg border bg-muted/20 p-3">
          <h4 className="mb-2 text-sm font-medium">Mutation Plan</h4>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs">
            {state.mutation.content}
          </pre>
        </div>
      )}
      {state.status === "planned" && (
        <Button variant="outline" onClick={handleReset} className="mt-3">
          Reset
        </Button>
      )}
    </section>
  );
}
