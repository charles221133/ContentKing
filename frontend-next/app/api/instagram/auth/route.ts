import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const client_id = process.env.INSTAGRAM_CLIENT_ID!;
  const redirect_uri = process.env.INSTAGRAM_REDIRECT_URI!;
  const scope = 'user_profile,user_media,instagram_content_publish';
  const state = Math.random().toString(36).substring(2, 15);

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${state}`;

  return NextResponse.redirect(authUrl);
} 