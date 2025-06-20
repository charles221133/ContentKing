import { NextRequest, NextResponse } from 'next/server';
import { fetchTranscript } from 'youtube-transcript-plus';
import { YoutubeTranscript } from 'youtube-transcript';
import { createSupabaseServerClient } from '@/utils/supabaseServer';

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
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to extract a transcript.' }, { status: 401 });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({
        error: 'BadRequest',
        message: 'Missing or invalid YouTube URL.',
        status: 400,
      }, { status: 400 });
    }
    const normalizedUrl = normalizeYouTubeUrl(url);
    const videoIdMatch = normalizedUrl.match(/[?&]v=([^&#]+)/) || normalizedUrl.match(/youtu\.be\/([^?&#]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : normalizedUrl;
    // Debug logging
    console.log('[extract-transcript] Original URL:', url);
    console.log('[extract-transcript] Normalized URL:', normalizedUrl);
    console.log('[extract-transcript] Video ID:', videoId);
    const transcriptArr = await fetchTranscript(normalizedUrl, {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    });
    console.log('[extract-transcript] transcriptArr:', transcriptArr);
    if (!transcriptArr || transcriptArr.length === 0) {
      return NextResponse.json({
        error: 'TranscriptNotFound',
        message: 'No transcript found for this video.',
        status: 404,
      }, { status: 404 });
    }
    const transcriptText = transcriptArr.map((seg: { text: string }) => seg.text.trim()).join(' ');
    const paragraphs = transcriptArr.map((seg: { text: string }) => seg.text.trim());
    const start = transcriptArr[0]?.offset || 0;
    const last = transcriptArr[transcriptArr.length - 1];
    const end = last ? (last.offset + last.duration) : 0;
    const language = transcriptArr[0]?.lang || 'unknown';
    const metadata = {
      duration: end - start,
      language,
      extractedAt: new Date().toISOString(),
    };
    return NextResponse.json({
      videoId,
      transcript: transcriptText,
      paragraphs,
      metadata,
    });
  } catch (err: any) {
    let status = 500;
    let errorType = 'InternalServerError';
    let message = 'Failed to fetch transcript.';
    if (err && err.message && err.message.includes('Could not find')) {
      status = 404;
      errorType = 'TranscriptNotFound';
      message = err.message;
    }
    console.error('[extract-transcript] Error:', err);
    return NextResponse.json({
      error: errorType,
      message,
      status,
      details: err && err.message ? err.message : undefined,
    }, { status });
  }
} 