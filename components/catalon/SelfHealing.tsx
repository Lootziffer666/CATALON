"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  applyKnownLayoutFix,
  type A2UIDocument,
  type KnownLayoutBreak,
} from "@/lib/a2ui-ssot";

interface SelfHealingProps {
  document: A2UIDocument | null;
  onDocumentChange: (next: A2UIDocument) => void;
  className?: string;
}

export function SelfHealing({ document, onDocumentChange, className }: SelfHealingProps) {
  const [status, setStatus] = useState<string>("No issue checked yet.");
  const knownBreak: KnownLayoutBreak = "overflow-hidden-with-scroll";

  const hasContainer = useMemo(() => Boolean(document?.root.type === "Container"), [document]);

  const handleApply = () => {
    if (!document) {
      setStatus("No approved A2UI JSON available.");
      return;
    }

    const result = applyKnownLayoutFix(document, knownBreak);
    if (result.fixed) {
      onDocumentChange(result.next);
      setStatus("Rule-based fix applied: overflow hidden -> auto on container.");
      return;
    }

    setStatus("No matching known layout break found.");
  };

  return (
    <section className={className}>
      <h2 className="mb-2 text-lg font-semibold">Self-Healing Gate</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Deterministic minimal proof: known layout break uses a concrete rule, never a speculative retry.
      </p>
      <Button onClick={handleApply} disabled={!document || !hasContainer}>
        Apply Known Fix
      </Button>
      <p className="mt-2 text-sm">{status}</p>
    </section>
  );
}
