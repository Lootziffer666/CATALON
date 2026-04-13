import { NextRequest, NextResponse } from 'next/server';
import { executeComposition, validateComposition, ExecuteInput } from '@/lib/execute';
import { A2UIComponent } from '@/lib/a2ui-client';

interface ExecuteRequestBody {
  composition: A2UIComponent[];
  context?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequestBody = await request.json();
    
    if (!body.composition || !Array.isArray(body.composition)) {
      return NextResponse.json(
        { success: false, error: 'Invalid composition: must be an array of components' },
        { status: 400 }
      );
    }
    
    if (!validateComposition(body.composition)) {
      return NextResponse.json(
        { success: false, error: 'Invalid composition format' },
        { status: 400 }
      );
    }
    
    const input: ExecuteInput = {
      composition: body.composition,
      context: body.context,
    };
    
    const result = await executeComposition(input);
    
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}