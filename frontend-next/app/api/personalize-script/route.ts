import { NextRequest, NextResponse } from 'next/server';
import openai from '@/utils/openai';
import { personalizeScriptPrompt } from '@/utils/prompts';
import { findPromptScript, addPromptScript } from '@/utils/promptStorage';
import { createSupabaseServerClient } from '@/utils/supabaseServer';

// This API route is for script personalization using OpenAI. Any UI using this should use a dark theme by default.

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to personalize a script.' }, { status: 401 });
  }

  try {
    const { original, userStyle: user_style, scriptName, force } = await req.json();
    if (!original || typeof original !== 'string' || !user_style || typeof user_style !== 'string') {
      return NextResponse.json({
        error: 'BadRequest',
        message: 'Missing or invalid original or userStyle.',
        status: 400,
      }, { status: 400 });
    }

    // Check for cached result unless force is true
    if (!force) {
      const cached = await findPromptScript(original, user_style, user.id);
      if (cached) {
        return NextResponse.json(cached, { status: 200 });
      }
    }

    const prompt = personalizeScriptPrompt.build({ script: original, userStyle: user_style, newsNuggets: [] });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
    });

    const rewritten = completion.choices[0].message.content?.trim() || '';

    const newScript = {
      name: scriptName,
      original,
      user_style,
      rewritten,
      prompt_version: personalizeScriptPrompt.version,
      user_id: user.id
    };

    const savedScript = await addPromptScript(newScript);

    return NextResponse.json(savedScript, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (err: any) {
    return NextResponse.json({
      error: 'InternalServerError',
      message: err?.message || 'Failed to personalize script.',
      status: 500,
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
    });
  }
} 