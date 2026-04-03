"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  composePromptToA2UI,
  createRenderPlan,
  type A2UIDocument,
  type RenderInstruction,
} from "@/lib/a2ui-ssot";

interface A2UIComposerProps {
  className?: string;
  onDocumentComposed?: (doc: A2UIDocument) => void;
}

const renderInstruction = (instruction: RenderInstruction) => {
  switch (instruction.component) {
    case "Container":
    case "Card":
      return (
        <div key={instruction.id} className={instruction.className}>
          {instruction.text}
        </div>
      );
    case "Heading":
      return (
        <h3 key={instruction.id} className={instruction.className}>
          {instruction.text}
        </h3>
      );
    case "Text":
      return (
        <p key={instruction.id} className={instruction.className}>
          {instruction.text}
        </p>
      );
    case "Button":
      return (
        <Button key={instruction.id} className="w-fit">
          {instruction.text || "Continue"}
        </Button>
      );
    case "Input":
      return (
        <input
          key={instruction.id}
          placeholder={instruction.text || "Type here"}
          className={instruction.className}
        />
      );
    default:
      return null;
  }
};

export function A2UIComposer({ className, onDocumentComposed }: A2UIComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [doc, setDoc] = useState<A2UIDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const renderPlan = useMemo(() => (doc ? createRenderPlan(doc) : []), [doc]);

  const handleCompose = () => {
    try {
      const next = composePromptToA2UI(prompt);
      setDoc(next);
      onDocumentComposed?.(next);
      setError(null);
    } catch (composeError) {
      const message =
        composeError instanceof Error ? composeError.message : "Composition failed.";
      setError(message);
      setDoc(null);
    }
  };

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">A2UI Composer (SSOT)</h2>
        <p className="text-sm text-muted-foreground">
          Deterministic minimal proof: Prompt -&gt; A2UI JSON.
        </p>
      </header>

      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe a component"
          className="flex-1 rounded-md border border-input px-3 py-2 text-sm"
        />
        <Button onClick={handleCompose} disabled={!prompt.trim()}>
          Compose
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {doc && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-3">
            <h3 className="mb-2 text-sm font-medium">A2UI JSON</h3>
            <pre className="max-h-72 overflow-auto text-xs">
              {JSON.stringify(doc, null, 2)}
            </pre>
          </div>
          <div className="rounded-lg border p-3">
            <h3 className="mb-2 text-sm font-medium">Preview (from JSON plan)</h3>
            <div className="flex flex-col gap-3">{renderPlan.map(renderInstruction)}</div>
          </div>
        </div>
      )}
    </section>
  );
}
