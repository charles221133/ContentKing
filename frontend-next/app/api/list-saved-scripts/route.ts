import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { listPromptScripts } from '@/utils/promptStorage';
import { createServerClient } from '@supabase/ssr';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const scripts = await listPromptScripts(supabase, user.id);
    return NextResponse.json({ scripts }, { status: 200 });
  } catch (err: any) {
    console.error("Error in list-saved-scripts route:", err);
    return NextResponse.json({ error: 'Failed to fetch scripts' }, { status: 500 });
  }
} 