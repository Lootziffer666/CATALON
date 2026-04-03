"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { planScopedMutation, type A2UIDocument } from "@/lib/a2ui-ssot";

interface OpenHandsExecutorProps {
  document: A2UIDocument | null;
  className?: string;
}

const scopePolicy = {
  allowedPrefixes: ["app/", "components/", "lib/"],
};

export function OpenHandsExecutor({ document, className }: OpenHandsExecutorProps) {
  const [targetPath, setTargetPath] = useState("components/generated/preview-plan.ts");
  const [message, setMessage] = useState<string | null>(null);

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
        />
        <Button onClick={handlePlan} disabled={!canExecute}>
          Validate Scope
        </Button>
      </div>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </section>
  );
}
