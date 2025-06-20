import { NextRequest, NextResponse } from 'next/server';
import openai from '@/utils/openai';
import { createSupabaseServerClient } from '@/utils/supabaseServer';

const YOUTUBE_DESCRIPTION_PROMPT = `
Generate a YouTube description for a video with the given script and title.
The description should be engaging, include relevant keywords, and have a clear call to action.
Format the output nicely for a YouTube description box.

Title: {scriptName}

Script:
{rewritten}
`.trim();

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to generate a description.' }, { status: 401 });
  }

  try {
    const { rewritten, scriptName } = await req.json();

    if (!rewritten || !scriptName) {
      return NextResponse.json({ error: 'BadRequest', message: 'Missing rewritten script or script name.' }, { status: 400 });
    }

    const prompt = YOUTUBE_DESCRIPTION_PROMPT
      .replace('{rewritten}', rewritten)
      .replace('{scriptName}', scriptName);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const description = completion.choices[0].message.content;
    return NextResponse.json({ description });

  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate description', details: err?.message }, { status: 500 });
  }
} 