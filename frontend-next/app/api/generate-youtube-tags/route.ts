import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import openai from '@/utils/openai';

const YOUTUBE_TAGS_PROMPT = `
Generate a list of relevant, SEO-friendly YouTube tags based on the provided script.
The output should be a single, comma-separated string of tags.
Do not include any other text, titles, or explanations. Just the tags.

Example output:
tag one,tag two,another tag,keyword

Script:
---
{script}
---
`;

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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { script } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 });
    }

    const prompt = YOUTUBE_TAGS_PROMPT.replace('{script}', script);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const tags = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({ tags }, { status: 200 });
  } catch (err: any) {
    console.error('Error generating tags:', err);
    return NextResponse.json({ error: 'Failed to generate tags', details: err.message }, { status: 500 });
  }
} 