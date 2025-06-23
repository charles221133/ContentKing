import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import openai from '@/utils/openai';
import { generateVariantsPrompt } from '@/utils/prompts';

// This API route is for generating paragraph variants using OpenAI.

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
    const { paragraph, userStyle, newsNuggets } = await req.json();

    if (!paragraph) {
      return NextResponse.json({ error: 'Paragraph is required' }, { status: 400 });
    }

    const promptString = generateVariantsPrompt.build({
      paragraph,
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

    const variants = completion.choices[0]?.message?.content || '';

    // The frontend expects a 'rewritten' property containing the variants text
    return NextResponse.json({ rewritten: variants }, { status: 200 });

  } catch (err: any) {
    console.error('Error in generate-variants route:', err);
    return NextResponse.json(
      {
        error: 'Failed to generate variants',
        details: err?.message,
      },
      { status: 500 }
    );
  }
} 