import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { createSupabaseServerClient } from '@/utils/supabaseServer';

async function downloadVideoBuffer(videoUrl: string): Promise<Buffer> {
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error('Failed to download video');
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to upload a video.' }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'Google OAuth environment variables not set.' }, { status: 500 });
  }

  const body = await req.json();
  const { videoUrl, title, description } = body;
  if (!videoUrl || !title) {
    return NextResponse.json({ error: 'Missing videoUrl or title.' }, { status: 400 });
  }

  // Get refresh token from cookie
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/yt_refresh_token=([^;]+)/);
  if (!match) {
    return NextResponse.json({ error: 'No YouTube refresh token found. Please authenticate.' }, { status: 401 });
  }
  const refreshToken = decodeURIComponent(match[1]);

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  await oauth2Client.getAccessToken(); // Ensures access token is fresh

  try {
    const videoBuffer = await downloadVideoBuffer(videoUrl);
    const videoStream = Readable.from(videoBuffer);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description: description || '',
        },
        status: {
          privacyStatus: 'public',
        },
      },
      media: {
        body: videoStream,
      },
    });
    return NextResponse.json({ videoId: res.data.id });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to upload video', details: String(err) }, { status: 500 });
  }
} 