import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      accessToken,
      video_url,
      title,
      privacy_level = 'SELF_ONLY',
      disable_duet = false,
      disable_comment = false,
      disable_stitch = false,
      video_cover_timestamp_ms,
      is_aigc = false
    } = await req.json();

    if (!accessToken || !video_url) {
      return NextResponse.json({ error: 'Missing accessToken or video_url' }, { status: 400 });
    }

    const body = {
      post_info: {
        title,
        privacy_level,
        disable_duet,
        disable_comment,
        disable_stitch,
        video_cover_timestamp_ms,
        is_aigc
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url
      }
    };

    const tiktokRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(body)
    });

    const data = await tiktokRes.json();
    return NextResponse.json(data, { status: tiktokRes.status });
  } catch (err: any) {
    console.error('Error posting to TikTok:', err);
    return NextResponse.json({ error: 'Failed to post to TikTok', details: String(err) }, { status: 500 });
  }
} 