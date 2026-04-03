import { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export interface A2UIComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: A2UIComponent[];
}

export interface DesignSuggestion {
  id: string;
  description: string;
  components: A2UIComponent[];
  confidence: number;
}

export interface PreviewData {
  id: string;
  components: A2UIComponent[];
  metadata: {
    createdAt: string;
    style: string;
    theme: string;
  };
}

export interface SemanticCompositionInput {
  description: string;
  style?: 'modern' | 'classic' | 'minimal' | 'playful' | 'professional';
  theme?: 'light' | 'dark' | 'auto';
}

export interface CompositionResponse {
  success: boolean;
  preview: PreviewData | null;
  error?: string;
}

export interface DesignSuggestionsInput {
  context: string;
  constraints?: string[];
  count?: number;
}

export interface PreviewGenerationInput {
  components: A2UIComponent[];
  viewport?: 'desktop' | 'tablet' | 'mobile';
  style?: string;
  theme?: string;
}

const A2UI_API_BASE = process.env.A2UI_API_URL || 'http://localhost:8080/api';

async function a2uiRequest<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${A2UI_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`A2UI request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function composeSemantically(
  input: SemanticCompositionInput
): Promise<CompositionResponse> {
  try {
    const result = await a2uiRequest<CompositionResponse>('/compose', {
      description: input.description,
      style: input.style || 'modern',
      theme: input.theme || 'auto',
    });
    return result;
  } catch (error) {
    return {
      success: false,
      preview: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getDesignSuggestions(
  input: DesignSuggestionsInput
): Promise<DesignSuggestion[]> {
  try {
    const result = await a2uiRequest<DesignSuggestion[]>('/suggestions', {
      context: input.context,
      constraints: input.constraints || [],
      count: input.count || 3,
    });
    return result;
  } catch (error) {
    console.error('Failed to get design suggestions:', error);
    return [];
  }
}

export async function generatePreview(
  input: PreviewGenerationInput
): Promise<PreviewData> {
  const result = await a2uiRequest<PreviewData>('/preview', {
    components: input.components,
    viewport: input.viewport || 'desktop',
    style: input.style || 'modern',
    theme: input.theme || 'light',
  });
  return result;
}

export function createButtonComponent(
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default',
  size: 'default' | 'sm' | 'lg' | 'icon' = 'default',
  props?: Partial<ButtonHTMLAttributes<HTMLButtonElement>>
): A2UIComponent {
  return {
    id: `btn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'Button',
    props: {
      variant,
      size,
      ...props,
    },
  };
}

export function createInputComponent(
  type: 'text' | 'email' | 'password' | 'search' | 'number' = 'text',
  placeholder?: string,
  props?: Partial<InputHTMLAttributes<HTMLInputElement>>
): A2UIComponent {
  return {
    id: `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'Input',
    props: {
      type,
      placeholder,
      ...props,
    },
  };
}

export function createTextareaComponent(
  placeholder?: string,
  props?: Partial<TextareaHTMLAttributes<HTMLTextAreaElement>>
): A2UIComponent {
  return {
    id: `textarea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'Textarea',
    props: {
      placeholder,
      ...props,
    },
  };
}

export function createCardComponent(
  title?: string,
  description?: string,
  children?: A2UIComponent[]
): A2UIComponent {
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'Card',
    props: {
      title,
      description,
    },
    children,
  };
}

export function createContainerComponent(
  children: A2UIComponent[],
  layout: 'stack' | 'grid' | 'flex' = 'stack',
  gap?: number
): A2UIComponent {
  return {
    id: `container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'Container',
    props: {
      layout,
      gap,
    },
    children,
  };
}

export function createBadgeComponent(
  variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default',
  children?: string
): A2UIComponent {
  return {
    id: `badge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'Badge',
    props: {
      variant,
    },
    children: children
      ? [{ id: 'text', type: 'Text', props: { children: children } }]
      : undefined,
  };
}

export function createSeparatorComponent(): A2UIComponent {
  return {
    id: `separator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'Separator',
    props: {},
  };
}