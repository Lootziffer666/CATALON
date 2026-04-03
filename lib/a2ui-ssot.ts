export type A2UINodeType = "Container" | "Card" | "Heading" | "Text" | "Button" | "Input";

export interface A2UINode {
  id: string;
  type: A2UINodeType;
  props: Record<string, string | number | boolean>;
  children?: A2UINode[];
}

export interface A2UIDocument {
  version: "1.0";
  sourcePrompt: string;
  root: A2UINode;
}

export interface RenderInstruction {
  id: string;
  component: A2UINodeType;
  className: string;
  text?: string;
}

export interface ScopePolicy {
  allowedPrefixes: string[];
}

export interface PlannedFileMutation {
  filePath: string;
  content: string;
}

const sanitizePrompt = (prompt: string): string => prompt.trim().replace(/\s+/g, " ");

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40) || "ui";

const stableId = (prefix: string, seed: string): string => `${prefix}-${slugify(seed)}`;

export function composePromptToA2UI(prompt: string): A2UIDocument {
  const cleanedPrompt = sanitizePrompt(prompt);
  if (!cleanedPrompt) {
    throw new Error("Prompt must not be empty.");
  }

  const wantsInput = /input|form|email|search|login/i.test(cleanedPrompt);
  const wantsButton = /button|cta|submit|start|action/i.test(cleanedPrompt);

  const children: A2UINode[] = [
    {
      id: stableId("heading", cleanedPrompt),
      type: "Heading",
      props: { text: "Generated from prompt" },
    },
    {
      id: stableId("text", cleanedPrompt),
      type: "Text",
      props: { text: cleanedPrompt },
    },
  ];

  if (wantsInput) {
    children.push({
      id: stableId("input", cleanedPrompt),
      type: "Input",
      props: { placeholder: "Type here" },
    });
  }

  if (wantsButton || !wantsInput) {
    children.push({
      id: stableId("button", cleanedPrompt),
      type: "Button",
      props: { label: "Continue" },
    });
  }

  return {
    version: "1.0",
    sourcePrompt: cleanedPrompt,
    root: {
      id: stableId("root", cleanedPrompt),
      type: "Container",
      props: { layout: "stack", gap: 12, overflow: "visible" },
      children: [
        {
          id: stableId("card", cleanedPrompt),
          type: "Card",
          props: { tone: "neutral" },
          children,
        },
      ],
    },
  };
}

const classMap: Record<A2UINodeType, string> = {
  Container: "flex flex-col gap-3",
  Card: "rounded-lg border bg-card p-4 shadow-sm",
  Heading: "text-lg font-semibold",
  Text: "text-sm text-muted-foreground",
  Button: "inline-flex rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground",
  Input: "h-10 rounded-md border border-input bg-background px-3 text-sm",
};

export function createRenderPlan(doc: A2UIDocument): RenderInstruction[] {
  const instructions: RenderInstruction[] = [];

  const visit = (node: A2UINode): void => {
    const textValue =
      typeof node.props.text === "string"
        ? node.props.text
        : typeof node.props.label === "string"
          ? node.props.label
          : typeof node.props.placeholder === "string"
            ? node.props.placeholder
            : undefined;

    instructions.push({
      id: node.id,
      component: node.type,
      className: classMap[node.type],
      text: textValue,
    });

    node.children?.forEach(visit);
  };

  visit(doc.root);
  return instructions;
}

export function planScopedMutation(
  doc: A2UIDocument,
  targetPath: string,
  policy: ScopePolicy
): PlannedFileMutation {
  const inScope = policy.allowedPrefixes.some((prefix) => targetPath.startsWith(prefix));
  if (!inScope) {
    throw new Error(`Target path '${targetPath}' is outside allowed scope.`);
  }

  const plan = createRenderPlan(doc)
    .map((item) => `- ${item.component}: ${item.id}`)
    .join("\n");

  return {
    filePath: targetPath,
    content: `// Generated from A2UI SSOT\n// Prompt: ${doc.sourcePrompt}\n// Plan:\n${plan}\n`,
  };
}

export type KnownLayoutBreak = "overflow-hidden-with-scroll";

export function applyKnownLayoutFix(
  doc: A2UIDocument,
  breakType: KnownLayoutBreak
): { fixed: boolean; next: A2UIDocument } {
  if (breakType !== "overflow-hidden-with-scroll") {
    return { fixed: false, next: doc };
  }

  const cloned: A2UIDocument = JSON.parse(JSON.stringify(doc));
  let fixed = false;

  const walk = (node: A2UINode) => {
    if (node.type === "Container" && node.props.overflow === "hidden") {
      node.props.overflow = "auto";
      fixed = true;
    }
    node.children?.forEach(walk);
  };

  walk(cloned.root);
  return { fixed, next: cloned };
}
