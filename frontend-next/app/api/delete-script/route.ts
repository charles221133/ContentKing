import { NextRequest, NextResponse } from 'next/server';
import { deletePromptScript } from '@/utils/promptStorage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Script ID is required' }, { status: 400 });
    }

    await deletePromptScript(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Error in delete-script route:", err);
    return NextResponse.json({ error: 'Failed to delete script', details: err.message }, { status: 500 });
  }
} 