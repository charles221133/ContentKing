import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { addPromptScript } from '@/utils/promptStorage';
import openai from '@/utils/openai'; // Use the correct OpenAI client
import { personalizeScriptPrompt } from '@/utils/prompts';

// This API route is for script personalization using OpenAI. Any UI using this should use a dark theme by default.

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
    const { id, script, userStyle, newsNuggets } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 });
    }

    // This builds the entire prompt as a single string.
    const promptString = personalizeScriptPrompt.build({
      script,
      userStyle: userStyle || 'Fireship',
      newsNuggets: newsNuggets || [],
    });
    
    // The entire string is the prompt. We send it as a single user message.
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', 
      messages: [
        {
          role: 'user',
          content: promptString,
        },
      ],
    });

    let personalizedScript = completion.choices[0]?.message?.content || '';
    // Clean the response: remove any lines that are just '---'
    personalizedScript = personalizedScript.split('\n').filter(line => line.trim() !== '---').join('\n');
    
    let savedScript;
    if (id) {
      // If an ID was provided, update the existing script
      const { data, error } = await supabase
        .from('scripts')
        .update({ rewritten: personalizedScript, user_style: userStyle || 'Fireship' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      savedScript = data;
    } else {
      // Otherwise, create a new script record
      savedScript = await addPromptScript({
        name: `Personalized: ${script.substring(0, 20)}...`,
        original: script,
        user_style: userStyle || 'Fireship',
        rewritten: personalizedScript,
        prompt_version: personalizeScriptPrompt.version,
        user_id: user.id,
      });
    }

    return NextResponse.json({ script: personalizedScript, savedScriptId: savedScript.id }, { status: 200 });
  } catch (err: any) {
    console.error('Error in personalize-script route:', err);
    return NextResponse.json(
      {
        error: 'Failed to personalize script',
        details: err?.message,
      },
      { status: 500 }
    );
  }
} 