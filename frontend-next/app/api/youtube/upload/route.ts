import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Readable } from 'stream';

const OAuth2 = google.auth.OAuth2;

async function downloadVideoBuffer(videoUrl: string): Promise<Buffer> {
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error('Failed to download video');
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
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

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'Google OAuth environment variables not set.' }, { status: 500 });
  }

  const body = await req.json();
  const { videoUrl, title, description, tags, privacyStatus, madeForKids } = body;
  if (!videoUrl || !title) {
    return NextResponse.json({ error: 'Missing videoUrl or title.' }, { status: 400 });
  }

  // Get refresh token from cookie (server-side cookie store)
  const refreshTokenCookie = cookieStore.get('yt_refresh_token')?.value;
  if (!refreshTokenCookie) {
    // Return a specific error flag so the client can prompt OAuth instead of logging out
    return NextResponse.json({ error: 'youtube_token_invalid' }, { status: 401 });
  }
  const refreshToken = decodeURIComponent(refreshTokenCookie);

  const oauth2Client = new OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    await oauth2Client.getAccessToken(); // Ensures access token is fresh

    const videoBuffer = await downloadVideoBuffer(videoUrl);
    const videoStream = Readable.from(videoBuffer);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description: description || '',
          tags: tags || [],
        },
        status: {
          privacyStatus: privacyStatus || 'private',
          selfDeclaredMadeForKids: madeForKids || false,
        },
      },
      media: {
        body: videoStream,
      },
    });
    return NextResponse.json({ videoId: res.data.id });
  } catch (err: any) {
    if (err.message && err.message.includes('invalid_grant')) {
      return NextResponse.json({ error: 'youtube_token_invalid' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to upload video', details: String(err) }, { status: 500 });
  }
} 