import { NextRequest, NextResponse } from 'next/server';

// Remove cache
// let newsCache: { newsStories: { headline: string; summary: string }[]; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

export async function GET(req: NextRequest) {
  try {
    // Remove cache check
    // if (newsCache && Date.now() - newsCache.timestamp < CACHE_DURATION) {
    //   return NextResponse.json({ newsStories: newsCache.newsStories, cached: true }, {
    //     status: 200,
    //     headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
    //   });
    // }

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'MissingAPIKey',
        message: 'PERPLEXITY_API_KEY is not set in the environment.',
        status: 500,
      }, { status: 500 });
    }

    const prompt =
      "IMPORTANT: Return ONLY a JSON array of EXACTLY 7 objects, each with a 'headline' and a 'summary' (about 40 words). " +
      "Do not include any explanation, commentary, or preamble. Do not say 'here is the array' or anything similar. " +
      "Each story should be a recent (last 24 hours) viral or trending news story that is popular on TikTok or other social media, " +
      "especially in the technology space (e.g., generative AI, internet culture, creators, or tech companies). " +
      "Focus on stories that would be recognized by social media users, especially those interested in tech, memes, or viral trends. " +
      "The array should look like: [{\"headline\": \"...\", \"summary\": \"...\"}, ...].";

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: 'PerplexityAPIError',
        message: errorText,
        status: response.status,
      }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    console.log('Perplexity raw content:', content);
    let newsStories: { headline: string; summary: string }[] = [];
    let parseError: any = null;
    try {
      // Try to parse the model's response as JSON
      newsStories = JSON.parse(content);
      // Validate: must be array of objects with headline and summary
      if (
        !Array.isArray(newsStories) ||
        !newsStories.every(
          (item) =>
            item &&
            typeof item === 'object' &&
            typeof item.headline === 'string' &&
            typeof item.summary === 'string'
        )
      ) {
        throw new Error('Not an array of headline/summary objects');
      }
    } catch (e) {
      parseError = e;
      // Fallback: try to extract the last JSON array from text
      let match = null;
      if (content) {
        // This regex finds the last [...] block in the string
        const arrayMatches = content.match(/\[[\s\S]*\]/g);
        if (arrayMatches && arrayMatches.length > 0) {
          match = arrayMatches[arrayMatches.length - 1];
        }
      }
      if (match) {
        try {
          newsStories = JSON.parse(match);
        } catch (e2) {
          parseError = e2;
          newsStories = [];
        }
      }
      // Fallback: extract Markdown numbered headlines (string[])
      if (!newsStories.length && content) {
        const lines = content.split('\n');
        const headlines = lines
          .map((line: string) => {
            const mdMatch = line.match(/^[0-9]+\.\s*(?:\*\*)?\"([^\"]+)\"(?:\*\*)?/);
            return mdMatch ? mdMatch[1] : null;
          })
          .filter(Boolean) as string[];
        // Convert to objects with empty summary for compatibility
        newsStories = headlines.map((headline) => ({ headline, summary: '' }));
      }
    }

    if (!newsStories.length) {
      console.error('Failed to parse news stories from Perplexity response.');
      console.error('Raw content:', content);
      if (parseError) console.error('Parse error:', parseError);
      return NextResponse.json({
        error: 'NoHeadlines',
        message: 'Failed to parse news stories from Perplexity response.',
        status: 500,
        rawContent: content,
        parseError: parseError ? String(parseError) : undefined,
      }, { status: 500 });
    }

    // After parsing and fallback logic, strictly enforce 5 results
    if (newsStories.length > 5) {
      newsStories = newsStories.slice(0, 5);
    }

    // Remove cache assignment
    // newsCache = { newsStories, timestamp: Date.now() };

    return NextResponse.json({ newsStories, cached: false }, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (err: any) {
    return NextResponse.json({
      error: 'InternalServerError',
      message: err?.message || 'Failed to fetch latest news.',
      status: 500,
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
    });
  }
} 