"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

type Viewport = "desktop" | "tablet" | "mobile";

const viewportSizes: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

const renderInstruction = (instruction: RenderInstruction, readOnly = true) => {
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
          readOnly={readOnly}
        />
      );
    default:
      return null;
  }
};

export function A2UIComposer({ className, onDocumentComposed }: A2UIComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [doc, setDoc] = useState<A2UIDocument | null>(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");

  const renderPlan = useMemo(() => (doc ? createRenderPlan(doc) : []), [doc]);

  const handleCompose = useCallback(() => {
    try {
      const next = composePromptToA2UI(prompt);
      setDoc(next);
      onDocumentComposed?.(next);
      setJsonError(null);
    } catch (composeError) {
      const message = composeError instanceof Error ? composeError.message : "Composition failed.";
      setJsonError(message);
      setDoc(null);
    }
  }, [prompt, onDocumentComposed]);

  const handleJsonChange = useCallback((value: string) => {
    try {
      const parsed = JSON.parse(value) as A2UIDocument;
      if (!parsed.root || !parsed.version) {
        throw new Error("Invalid A2UI document structure");
      }
      setDoc(parsed);
      setJsonError(null);
    } catch (parseError) {
      setJsonError(parseError instanceof Error ? parseError.message : "Invalid JSON");
    }
  }, []);

  const handleReset = useCallback(() => {
    setPrompt("");
    setDoc(null);
    setJsonError(null);
    setJsonMode(false);
  }, []);

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">A2UI Composer (SSOT)</h2>
        <p className="text-sm text-muted-foreground">
          Bidirectional interface: Prompt ↔ A2UI JSON ↔ Preview
        </p>
      </header>

      {!jsonMode && (
        <div className="flex flex-col gap-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a component (e.g., 'A login form with email and password inputs and a submit button')"
            className="min-h-[80px] resize-none"
          />
          <div className="flex gap-2">
            <Button onClick={handleCompose} disabled={!prompt.trim()}>
              Compose
            </Button>
            {doc && (
              <Button variant="outline" onClick={() => setJsonMode(true)}>
                Edit JSON
              </Button>
            )}
          </div>
        </div>
      )}

      {jsonMode && doc && (
        <div className="flex flex-col gap-3">
          <Textarea
            value={JSON.stringify(doc, null, 2)}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="min-h-[200px] font-mono text-xs"
            placeholder="Paste A2UI JSON here..."
          />
          <div className="flex gap-2">
            <Button onClick={() => setJsonMode(false)}>Done</Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      )}

      {(jsonError || doc) && (
        <div className="flex flex-col gap-2">
          {jsonError && (
            <p className="text-sm text-red-500">JSON Error: {jsonError}</p>
          )}
          
          {doc && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Viewport:</span>
                <div className="flex gap-1">
                  {(["desktop", "tablet", "mobile"] as Viewport[]).map((v) => (
                    <Button
                      key={v}
                      variant={viewport === v ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewport(v)}
                      className="capitalize"
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <h3 className="mb-2 text-sm font-medium">A2UI JSON</h3>
                  <pre className="max-h-48 overflow-auto text-xs">
                    {JSON.stringify(doc, null, 2)}
                  </pre>
                </div>
                <div className="rounded-lg border p-3">
                  <h3 className="mb-2 text-sm font-medium">Sandbox Preview</h3>
                  <div
                    className="mx-auto rounded border bg-background p-4 transition-all duration-200"
                    style={{ width: viewportSizes[viewport], maxWidth: "100%" }}
                  >
                    <div className="flex flex-col gap-3">
                      {renderPlan.map((instruction) => renderInstruction(instruction, true))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {doc && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/10 p-3">
          <h3 className="text-sm font-medium">Render Plan</h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {renderPlan.map((instruction, index) => (
              <li key={instruction.id}>
                {index + 1}. {instruction.component} ({instruction.id})
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}