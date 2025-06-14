import { NextRequest, NextResponse } from 'next/server';
import openai from '@/utils/openai';
import { personalizeScriptPrompt } from '@/utils/prompts';
import { findPromptScript, addPromptScript } from '@/utils/promptStorage';

// This API route is for script personalization using OpenAI. Any UI using this should use a dark theme by default.

export async function POST(req: NextRequest) {
  try {
    const { script, userStyle, force, newsNuggets } = await req.json();
    if (!script || typeof script !== 'string' || !userStyle || typeof userStyle !== 'string') {
      return NextResponse.json({
        error: 'BadRequest',
        message: 'Missing or invalid script or userStyle.',
        status: 400,
      }, { status: 400 });
    }
    if (!Array.isArray(newsNuggets) || newsNuggets.length !== 3 || newsNuggets.some(n => typeof n !== 'string' || !n.trim())) {
      return NextResponse.json({
        error: 'BadRequest',
        message: 'newsNuggets must be an array of 3 non-empty strings.',
        status: 400,
      }, { status: 400 });
    }

    // Check for cached result unless force is true
    if (!force) {
      const cached = await findPromptScript(script, userStyle);
      if (cached) {
        return NextResponse.json({
          rewritten: cached.rewritten,
          userStyle: cached.userStyle,
          cached: true,
          createdAt: cached.createdAt,
          promptVersion: cached.promptVersion,
        }, {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
        });
      }
    }

    // TODO: Get news nuggets from the API
    const prompt = personalizeScriptPrompt.build({ script, userStyle, newsNuggets });
    console.log('prompt', prompt);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a creative scriptwriter and comedian.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.85,
    });
    const rewritten = completion.choices[0]?.message?.content || '';
    // Save new result
    const saved = await addPromptScript({
      name: '',
      original: script,
      userStyle,
      rewritten,
      promptVersion: personalizeScriptPrompt.version,
    });
    return NextResponse.json({
      rewritten: saved.rewritten,
      userStyle: saved.userStyle,
      cached: false,
      createdAt: saved.createdAt,
      promptVersion: saved.promptVersion,
    }, {
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