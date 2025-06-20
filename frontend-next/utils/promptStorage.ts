// Simple file-based prompt script storage for MVP/demo purposes only.
// Not for production use. All UI using this should use a dark theme by default.
import { createClient } from '@supabase/supabase-js';
import { PromptScript } from '@/types/index';

// Note: This client is safe to use in the browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function listPromptScripts(userId: string): Promise<PromptScript[]> {
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
    const newScript = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        ...script,
        created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('scripts')
        .insert(newScript)
        .select()
        .single();

    if (error) {
        console.error('Error adding script:', error);
        throw new Error(error.message);
    }

    return data;
}

export async function getPromptScript(id: string): Promise<PromptScript | null> {
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

export async function deletePromptScript(id: string): Promise<void> {
  const { error } = await supabase
    .from('scripts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting script:', error);
    throw new Error(error.message);
  }
} 