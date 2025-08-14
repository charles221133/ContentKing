import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const hasToken = !!cookieStore.get('yt_refresh_token')?.value;
  return NextResponse.json({ connected: hasToken });
}


