import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { accessToken, video_url, caption } = await req.json();
    if (!accessToken || !video_url) {
      return NextResponse.json({ error: 'Missing accessToken or video_url' }, { status: 400 });
    }

    // 1. Get the user's Instagram user_id
    const userRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const userData = await userRes.json();
    if (!userData.id) {
      return NextResponse.json({ error: 'Failed to get Instagram user_id', details: userData }, { status: 400 });
    }
    const user_id = userData.id;

    // 2. Create a media object (container) for the video
    const createMediaRes = await fetch(`https://graph.facebook.com/v19.0/${user_id}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url,
        caption: caption || '',
        access_token: accessToken
      })
    });
    const createMediaData = await createMediaRes.json();
    if (!createMediaData.id) {
      return NextResponse.json({ error: 'Failed to create Instagram media', details: createMediaData }, { status: 400 });
    }
    const creation_id = createMediaData.id;

    // 3. Publish the media object
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${user_id}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id,
        access_token: accessToken
      })
    });
    const publishData = await publishRes.json();
    if (!publishData.id) {
      return NextResponse.json({ error: 'Failed to publish Instagram Reel', details: publishData }, { status: 400 });
    }

    return NextResponse.json({ success: true, reel_id: publishData.id });
  } catch (err: any) {
    return NextResponse.json({ error: 'Unexpected error', details: err.message || err.toString() }, { status: 500 });
  }
} 