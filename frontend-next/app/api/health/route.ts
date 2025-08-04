import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
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
    // Try a trivial call to check connectivity
    const { data, error } = await supabase.auth.getUser();
    // Acceptable errors: 401 (unauthorized) or 400 (AuthSessionMissingError)
    if (
      error &&
      !(
        error.status === 401 ||
        (error.status === 400 && error.name === 'AuthSessionMissingError')
      )
    ) {
      console.error('[health] Supabase error:', error);
      return NextResponse.json({ status: 'fail', error: error.message, step: 'supabase.getUser', errorObj: error }, { status: 500 });
    }
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err: any) {
    console.error('[health] Exception:', err);
    return NextResponse.json({ status: 'fail', error: err?.message || 'Unknown error', step: 'exception', errorObj: err }, { status: 500 });
  }
} 