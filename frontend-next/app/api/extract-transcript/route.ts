import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const EXTRACT_TRANSCRIPT_PROMPT = `
Summarize the following YouTube transcript into a concise script format.
Focus on the main points and dialogues. Ignore ads, self-promotions, and off-topic chatter.
The output should be a clean, readable script.

Transcript:
{transcript}
`;

function normalizeYouTubeUrl(url: string): string {
  // Extract video ID from various YouTube URL formats
  const idMatch = url.match(/[?&]v=([^&#]+)/) || url.match(/youtu\.be\/([^?&#]+)/);
  const videoId = idMatch ? idMatch[1] : null;
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

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
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const normalizedUrl = normalizeYouTubeUrl(url);
    const transcript = await YoutubeTranscript.fetchTranscript(normalizedUrl);

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'Could not extract transcript or transcript is empty' }, { status: 404 });
    }

    const fullTranscript = transcript.map(item => item.text).join(' ');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = EXTRACT_TRANSCRIPT_PROMPT.replace('{transcript}', fullTranscript);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const script = response.text();

    return NextResponse.json({ script: script, originalTranscript: fullTranscript });
  } catch (err: any) {
    console.error('Error extracting transcript:', err);
    return NextResponse.json({ error: 'Failed to extract transcript', details: err?.message }, { status: 500 });
  }
} 