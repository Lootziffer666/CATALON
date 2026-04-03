"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  A2UIComponent,
  DesignSuggestion,
  PreviewData,
  SemanticCompositionInput,
} from "@/lib/a2ui-client";

interface A2UIComposerProps {
  className?: string;
  onPreviewUpdate?: (preview: PreviewData) => void;
  onDesignSelect?: (design: DesignSuggestion) => void;
}

export function A2UIComposer({
  className,
  onPreviewUpdate,
  onDesignSelect,
}: A2UIComposerProps) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [refinementHistory, setRefinementHistory] = useState<string[]>([]);

  const generateMockPreview = useCallback(
    (description: string): PreviewData => {
      const components: A2UIComponent[] = [
        {
          id: "preview-card",
          type: "Card",
          props: {
            title: "Design Preview",
            description: description.slice(0, 100),
          },
          children: [
            {
              id: "preview-button",
              type: "Button",
              props: {
                variant: "default",
                children: "Interact",
              },
            },
          ],
        },
      ];

      return {
        id: `preview-${Date.now()}`,
        components,
        metadata: {
          createdAt: new Date().toISOString(),
          style: "modern",
          theme: "light",
        },
      };
    },
    []
  );

  const generateMockSuggestions = useCallback(
    (context: string): DesignSuggestion[] => {
      return [
        {
          id: "suggestion-1",
          description: `${context} - Modern approach with clean lines`,
          components: [
            {
              id: "sugg-1-card",
              type: "Card",
              props: { title: "Modern Design", description: "Clean and minimal" },
            },
          ],
          confidence: 0.92,
        },
        {
          id: "suggestion-2",
          description: `${context} - Classic approach with refined details`,
          components: [
            {
              id: "sugg-2-card",
              type: "Card",
              props: { title: "Classic Design", description: "Timeless aesthetics" },
            },
          ],
          confidence: 0.85,
        },
        {
          id: "suggestion-3",
          description: `${context} - Playful approach with vibrant elements`,
          components: [
            {
              id: "sugg-3-card",
              type: "Card",
              props: { title: "Playful Design", description: "Fun and engaging" },
            },
          ],
          confidence: 0.78,
        },
      ];
    },
    []
  );

  const handleCompose = useCallback(async () => {
    if (!input.trim()) return;

    setIsProcessing(true);

    try {
      const inputData: SemanticCompositionInput = {
        description: input,
        style: "modern",
        theme: "auto",
      };

      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockPreview = generateMockPreview(input);
      setPreview(mockPreview);
      onPreviewUpdate?.(mockPreview);

      const mockSuggestions = generateMockSuggestions(input);
      setSuggestions(mockSuggestions);

      setRefinementHistory((prev) => [...prev, input]);
    } catch (error) {
      console.error("Composition failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [input, generateMockPreview, generateMockSuggestions, onPreviewUpdate]);

  const handleSuggestionSelect = useCallback(
    (suggestion: DesignSuggestion) => {
      setSelectedDesign(suggestion.id);
      onDesignSelect?.(suggestion);

      const refinedPreview: PreviewData = {
        id: `preview-refined-${Date.now()}`,
        components: suggestion.components,
        metadata: {
          createdAt: new Date().toISOString(),
          style: "modern",
          theme: "light",
        },
      };
      setPreview(refinedPreview);
      onPreviewUpdate?.(refinedPreview);
    },
    [onDesignSelect, onPreviewUpdate]
  );

  const handleRefine = useCallback(
    (refinement: string) => {
      setInput(refinement);
      handleCompose();
    },
    [handleCompose]
  );

  const renderComponent = (component: A2UIComponent) => {
    switch (component.type) {
      case "Card":
        return (
          <div
            key={component.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            {component.props.title && (
              <h3 className="font-semibold">{component.props.title as string}</h3>
            )}
            {component.props.description && (
              <p className="text-sm text-muted-foreground">
                {component.props.description as string}
              </p>
            )}
            {component.children?.map(renderComponent)}
          </div>
        );
      case "Button":
        return (
          <Button key={component.id} variant={(component.props.variant as "default") || "default"}>
            {(component.props.children as string) || "Button"}
          </Button>
        );
      case "Badge":
        return (
          <span
            key={component.id}
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
          >
            {(component.children?.[0]?.props?.children as string) || "Badge"}
          </span>
        );
      case "Container":
        return (
          <div
            key={component.id}
            className={cn(
              "flex",
              component.props.layout === "grid" && "grid grid-cols-2 gap-4",
              component.props.layout === "flex" && "flex gap-4",
              component.props.layout === "stack" && "flex flex-col gap-4"
            )}
          >
            {component.children?.map(renderComponent)}
          </div>
        );
      case "Input":
        return (
          <input
            key={component.id}
            type={(component.props.type as string) || "text"}
            placeholder={(component.props.placeholder as string) || "Enter text..."}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        );
      case "Textarea":
        return (
          <textarea
            key={component.id}
            placeholder={(component.props.placeholder as string) || "Enter text..."}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        );
      case "Separator":
        return <hr key={component.id} className="my-4 border-border" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">A2UI Composer</h2>
          <span className="text-xs text-muted-foreground">Bidirectional Interface</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your design intent... (e.g., 'A mood control that feels like Picasso')"
            className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleCompose()}
          />
          <Button onClick={handleCompose} disabled={isProcessing || !input.trim()}>
            {isProcessing ? "Processing..." : "Compose"}
          </Button>
        </div>

        {refinementHistory.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>History:</span>
            {refinementHistory.slice(-3).map((item, idx) => (
              <span
                key={idx}
                className="rounded bg-muted px-2 py-1"
              >
                {item.slice(0, 30)}...
              </span>
            ))}
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Design Suggestions</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted",
                  selectedDesign === suggestion.id && "border-primary bg-muted"
                )}
              >
                <span className="text-sm font-medium">{suggestion.description}</span>
                <span className="text-xs text-muted-foreground">
                  Confidence: {Math.round(suggestion.confidence * 100)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Sandbox Preview</h3>
          {preview && (
            <span className="text-xs text-muted-foreground">
              Generated: {new Date(preview.metadata.createdAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="min-h-[200px] rounded-lg border border-dashed p-6">
          {preview ? (
            <div className="flex flex-col gap-4">
              {preview.components.map(renderComponent)}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p className="text-sm">Enter a description to generate a preview</p>
            </div>
          )}
        </div>

        {preview && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Refine the design... (e.g., 'Add glass effect')"
              className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRefine((e.target as HTMLInputElement).value);
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                setPreview(null);
                setSuggestions([]);
                setSelectedDesign(null);
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
