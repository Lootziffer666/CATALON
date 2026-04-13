import { A2UIComponent } from './a2ui-client';

export interface ExecuteInput {
  composition: A2UIComponent[];
  context?: Record<string, unknown>;
}

export interface ExecuteResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

export async function executeComposition(
  input: ExecuteInput
): Promise<ExecuteResult> {
  try {
    const result = await executeInSandbox(input.composition, input.context);
    return {
      success: true,
      output: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Execution failed',
    };
  }
}

async function executeInSandbox(
  composition: A2UIComponent[],
  context?: Record<string, unknown>
): Promise<unknown> {
  const results: Record<string, unknown> = {};
  
  for (const component of composition) {
    results[component.id] = await executeComponent(component, context);
  }
  
  return results;
}

async function executeComponent(
  component: A2UIComponent,
  context?: Record<string, unknown>
): Promise<unknown> {
  const { type, props, children } = component;
  
  const componentResult: Record<string, unknown> = {
    id: component.id,
    type,
    props: { ...props },
    rendered: true,
  };
  
  if (children && children.length > 0) {
    const childResults = await Promise.all(
      children.map((child) => executeComponent(child, context))
    );
    componentResult.children = childResults;
  }
  
  return componentResult;
}

export function validateComposition(composition: unknown): boolean {
  if (!Array.isArray(composition)) {
    return false;
  }
  
  for (const component of composition) {
    if (!isValidComponent(component)) {
      return false;
    }
  }
  
  return true;
}

function isValidComponent(component: unknown): boolean {
  if (typeof component !== 'object' || component === null) {
    return false;
  }
  
  const comp = component as Record<string, unknown>;
  return (
    typeof comp.id === 'string' &&
    typeof comp.type === 'string' &&
    typeof comp.props === 'object'
  );
}
