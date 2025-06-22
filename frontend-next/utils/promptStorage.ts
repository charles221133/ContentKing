// Simple file-based prompt script storage for MVP/demo purposes only.
// Not for production use. All UI using this should use a dark theme by default.
import type { SupabaseClient } from '@supabase/supabase-js';
import { PromptScript } from '@/types/index';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function listPromptScripts(supabase: SupabaseClient, userId: string): Promise<PromptScript[]> {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scripts:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function addPromptScript(script: Omit<PromptScript, 'id' | 'createdAt'> & { user_id: string }): Promise<PromptScript> {
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

    const { data, error } = await supabase
        .from('scripts')
        .insert(script)
        .select()
        .single();

    if (error) {
        console.error('Error adding script:', error);
        throw new Error(error.message);
    }

    return data;
}

export async function findPromptScript(supabase: SupabaseClient, original: string, userStyle: string, userId: string): Promise<PromptScript | null> {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('original', original)
    .eq('user_style', userStyle)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error finding script:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function getPromptScript(supabase: SupabaseClient, id: string): Promise<PromptScript | null> {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching script:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function updatePromptScript(script: PromptScript): Promise<PromptScript> {
  if (!script.id) {
    throw new Error("Cannot update a script without an ID.");
  }
  
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
  
  const { data, error } = await supabase
    .from('scripts')
    .update({
      name: script.name,
      original: script.original,
      rewritten: script.rewritten,
      user_style: script.user_style,
      prompt_version: script.prompt_version,
      description: script.description,
      video_url: script.video_url,
      status: script.status,
      user_id: script.user_id,
    })
    .eq('id', script.id)
    .select()
    .single();

  if (error) {
    console.error('Error in updatePromptScript:', error);
    throw error;
  }
  return data;
}

export async function deletePromptScript(id: string): Promise<void> {
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

  const { error } = await supabase
    .from('scripts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting script:', error);
    throw new Error(error.message);
  }
} 