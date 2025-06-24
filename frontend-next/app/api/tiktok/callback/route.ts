import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const client_id = process.env.TIKTOK_CLIENT_ID!;
  const client_secret = process.env.TIKTOK_CLIENT_SECRET!;
  const redirect_uri = process.env.TIKTOK_REDIRECT_URI!;

  // Exchange code for access token
  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: client_id,
      client_secret,
      code,
      grant_type: 'authorization_code',
      redirect_uri
    })
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.json({ error: 'Failed to get TikTok access token', details: tokenData }, { status: 400 });
  }

  // Set access token in a cookie (HttpOnly, Secure)
  const response = NextResponse.redirect('/publish');
  response.cookies.set('tiktok_access_token', tokenData.access_token, {
    httpOnly: true,
    secure: true,
    path: '/',
    maxAge: tokenData.expires_in || 3600
  });
  return response;
} 