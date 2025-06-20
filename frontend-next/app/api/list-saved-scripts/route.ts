import { NextRequest, NextResponse } from 'next/server';
import { listPromptScripts } from '@/utils/promptStorage';
import { createSupabaseServerClient } from '@/utils/supabaseServer';

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to view saved scripts.' }, { status: 401 });
  }

  try {
    const scripts = await listPromptScripts(user.id);
    return NextResponse.json({ scripts }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to load saved scripts', details: err?.message }, { status: 500 });
  }
} 