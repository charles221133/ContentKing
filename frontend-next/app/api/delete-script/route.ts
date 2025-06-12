import { NextRequest, NextResponse } from 'next/server';
import { listPromptScripts } from '@/utils/promptStorage';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'prompt-scripts.json');

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'BadRequest', message: 'Missing script ID.' }, { status: 400 });
    }
    const all = await listPromptScripts();
    const filtered = all.filter(s => s.id !== id);
    await fs.writeFile(DATA_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete script', details: err?.message }, { status: 500 });
  }
} 