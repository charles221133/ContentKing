import { NextRequest, NextResponse } from 'next/server';
import openai from '@/utils/openai';

export async function POST(req: NextRequest) {
  try {
    const { rewritten, scriptName } = await req.json();
    if (!rewritten || typeof rewritten !== 'string') {
      return NextResponse.json({ error: 'BadRequest', message: 'Missing or invalid rewritten script.' }, { status: 400 });
    }
    const prompt = `Write a concise, engaging YouTube video description (max 5000 characters) for the following video script. The description should summarize the video's content and entice viewers to watch, but do not include hashtags or links.\n\nVideo Title: ${scriptName || 'Untitled'}\n\nScript:\n${rewritten}`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes YouTube video descriptions.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });
    const description = completion.choices[0]?.message?.content?.trim() || '';
    return NextResponse.json({ description }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate description', details: err?.message }, { status: 500 });
  }
} 