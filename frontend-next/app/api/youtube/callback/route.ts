import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'Google OAuth environment variables not set.' }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'No code in callback.' }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    let refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      // Try to get the existing refresh token from the cookie
      const cookie = request.headers.get('cookie') || '';
      const match = cookie.match(/yt_refresh_token=([^;]+)/);
      if (match) {
        refreshToken = decodeURIComponent(match[1]);
      }
    }
    if (!refreshToken) {
      // Print a warning to the server console
      console.warn('[YouTube OAuth] No refresh token available after callback. This can happen if the user has previously authorized the app and did not revoke access. To fix: The user must go to https://myaccount.google.com/permissions, revoke access for this app, and then re-authenticate.');
      // Note: Programmatic revocation is possible via https://oauth2.googleapis.com/revoke, but user must re-consent manually.
      return new NextResponse(`
        <html><body>
          <h2>Authentication Error</h2>
          <p>We could not obtain a refresh token from Google. This can happen if you have previously authorized the app and did not revoke access. To fix this, please go to <a href="https://myaccount.google.com/permissions" target="_blank">your Google account permissions</a>, revoke access for this app, and then try again.</p>
        </body></html>
      `, {
        headers: {
          'Content-Type': 'text/html'
        },
        status: 400
      });
    }
    // Set refresh token cookie for 1 year
    const response = new NextResponse(`
      <html><body>
        <h2>Authentication successful!</h2>
        <script>
          window.opener && window.opener.postMessage({ youtubeAuth: true }, '*');
          window.close();
        </script>
      </body></html>
    `, {
      headers: {
        'Content-Type': 'text/html',
        'Set-Cookie': `yt_refresh_token=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`
      }
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Failed to get tokens', details: String(err) }, { status: 500 });
  }
} 