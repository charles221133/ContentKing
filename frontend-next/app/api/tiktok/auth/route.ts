import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const client_id = process.env.TIKTOK_CLIENT_ID!;
  const redirect_uri = process.env.TIKTOK_REDIRECT_URI!;
  const scope = 'video.publish';
  const state = Math.random().toString(36).substring(2, 15); // random state for CSRF protection

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${client_id}&scope=${encodeURIComponent(scope)}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&state=${state}`;

  return NextResponse.redirect(authUrl);
} 