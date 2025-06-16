import { NextRequest, NextResponse } from 'next/server';
import { addPromptScript } from '@/utils/promptStorage';

export async function POST(req: NextRequest) {
  try {
    const { id, createdAt, name, original, userStyle, rewritten, promptVersion, url, videoUrl, description } = await req.json();
    if (!original || typeof original !== 'string') {
      return NextResponse.json({ error: 'BadRequest', message: 'Missing or invalid script.' }, { status: 400 });
    }
    const saved = await addPromptScript({ id, createdAt, name: name || '', original, userStyle: userStyle || '', rewritten: rewritten || '', promptVersion: promptVersion || 'unknown', url: url || undefined, videoUrl: videoUrl || undefined, description: description || undefined });
    return NextResponse.json(saved, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to save script', details: err?.message }, { status: 500 });
  }
} 