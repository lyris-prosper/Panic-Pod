import { NextRequest, NextResponse } from 'next/server';
import { parseEvacuationTrigger } from '@/lib/qwenService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput } = body;

    if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
      return NextResponse.json(
        { error: 'Invalid input: userInput is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const parsedTrigger = await parseEvacuationTrigger(userInput);

    return NextResponse.json(parsedTrigger);
  } catch (error) {
    console.error('Error in parse-trigger API:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: `Failed to parse trigger: ${errorMessage}` },
      { status: 500 }
    );
  }
}
