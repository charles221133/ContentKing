import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const scriptData = body.script;
    let result;

    const isUUID = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

    if (scriptData.id && isUUID(scriptData.id)) {
      // If a valid UUID ID is provided, update the existing script
      const updatePayload = { ...scriptData, user_id: user.id };
      console.log('Attempting to UPDATE script with payload:', JSON.stringify(updatePayload, null, 2));
      const { data, error } = await supabase
        .from('scripts')
        .update(updatePayload)
        .eq('id', scriptData.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Otherwise, this is a new script.
      // Create a new payload without the temporary client-side ID.
      const { id, ...rest } = scriptData;
      const insertPayload = { ...rest, user_id: user.id };
      console.log('Attempting to INSERT new script with payload:', JSON.stringify(insertPayload, null, 2));
      const { data, error } = await supabase
        .from('scripts')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, script: result }, { status: 200 });
  } catch (err: any) {
    console.error('Error in save-script route:', err);
    return NextResponse.json(
      { error: 'Failed to save script', details: err?.message },
      { status: 500 }
    );
  }
} 