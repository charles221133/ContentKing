import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const YOUTUBE_DESCRIPTION_PROMPT = `
Generate a compelling YouTube description based on the provided script.
The description should be engaging, SEO-friendly, and include relevant keywords.
It should have a clear call-to-action and include links to social media if provided.
Format the output as a single block of text.

Script: {script}
Keywords: {keywords}
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
    const { script, keywords } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = YOUTUBE_DESCRIPTION_PROMPT
      .replace('{script}', script)
      .replace('{keywords}', keywords.join(', '));

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text();

    return NextResponse.json({ description }, { status: 200 });
  } catch (err: any) {
    console.error('Error generating description:', err);
    return NextResponse.json({ error: 'Failed to generate description', details: err.message }, { status: 500 });
  }
} 