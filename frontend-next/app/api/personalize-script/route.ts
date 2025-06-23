import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import openai from '@/utils/openai';
import { personalizeScriptPrompt, generateVariantsPrompt } from '@/utils/prompts';

// This API route is for script personalization using OpenAI.

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
    const { id, script, userStyle, newsNuggets, isVariantGeneration } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Script content is required' }, { status: 400 });
    }

    // Conditionally select the prompt and build the prompt string
    const promptString = isVariantGeneration
      ? generateVariantsPrompt.build({
          paragraph: script, // For variants, the 'script' is just a paragraph
          userStyle: userStyle || 'Fireship',
          newsNuggets: newsNuggets || [],
        })
      : personalizeScriptPrompt.build({
          script,
          userStyle: userStyle || 'Fireship',
          newsNuggets: newsNuggets || [],
        });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: promptString,
        },
      ],
    });

    const personalizedScript = completion.choices[0]?.message?.content || '';

    // The logic to save the script is complex and depends on whether it's a new script,
    // a full rewrite, or a variant update. The frontend currently handles saving variants.
    // For simplicity, this backend will focus on generation and returning the text.
    // The frontend will receive this and decide how to persist it.
    // We will return the 'rewritten' text, which might be a full script or variants.
    return NextResponse.json({ rewritten: personalizedScript }, { status: 200 });

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