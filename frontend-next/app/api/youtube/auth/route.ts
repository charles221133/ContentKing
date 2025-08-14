import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  const vercelEnv = process.env.VERCEL_ENV;
  let redirectUri: string;

  // Prefer explicitly configured redirect URI to avoid domain mismatch
  if (configuredRedirectUri) {
    redirectUri = configuredRedirectUri;
  } else if (vercelEnv === 'production' || vercelEnv === 'preview') {
    // Fallback for Vercel environments if explicit env not set
    redirectUri = `https://${process.env.VERCEL_URL}/api/youtube/callback`;
  } else {
    // Default to localhost for development.
    redirectUri = 'http://localhost:3000/api/youtube/callback';
  }

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google OAuth environment variables not set.' }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const scopes = ['https://www.googleapis.com/auth/youtube.upload'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  return NextResponse.redirect(url);
} 