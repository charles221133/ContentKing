import { NextRequest, NextResponse } from 'next/server';
import { listPromptScripts } from '@/utils/promptStorage';

export async function GET(req: NextRequest) {
  try {
    const scripts = await listPromptScripts();
    return NextResponse.json({ scripts }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to load saved scripts', details: err?.message }, { status: 500 });
  }
} 