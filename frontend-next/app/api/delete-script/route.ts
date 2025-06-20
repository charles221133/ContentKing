import { NextRequest, NextResponse } from 'next/server';
import { deletePromptScript } from '@/utils/promptStorage';
import { createSupabaseServerClient } from '@/utils/supabaseServer';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to delete a script.' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'BadRequest', message: 'Missing script ID.' }, { status: 400 });
    }
    
    // RLS in Supabase ensures the user can only delete their own script.
    await deletePromptScript(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete script', details: err?.message }, { status: 500 });
  }
} 