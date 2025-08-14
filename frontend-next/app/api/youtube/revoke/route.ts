import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('yt_refresh_token')?.value;

    if (refreshToken) {
        try {
            // Attempt to revoke at Google
            await fetch('https://oauth2.googleapis.com/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `token=${encodeURIComponent(refreshToken)}`,
            });
        } catch (e) {
            // Ignore revoke errors; we'll still clear the cookie
        }
    }

    const response = NextResponse.json({ ok: true });
    response.headers.set('Set-Cookie', `yt_refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    return response;
}


