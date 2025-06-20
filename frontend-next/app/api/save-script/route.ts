import { NextRequest, NextResponse } from 'next/server';
import { addPromptScript } from '@/utils/promptStorage';
import { createSupabaseServerClient } from '@/utils/supabaseServer';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to save a script.' }, { status: 401 });
  }

  try {
    const scriptData = await req.json();
    const result = await addPromptScript({ ...scriptData, user_id: user.id });
    return NextResponse.json({ success: true, script: result }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to save script', details: err?.message }, { status: 500 });
  }
} 