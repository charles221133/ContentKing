import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

  try {
    const { script, avatar_id, voice_id } = await req.json();
    if (!script || typeof script !== 'string' || !script.trim()) {
      return NextResponse.json({ error: 'Missing or invalid script.' }, { status: 400 });
    }
    if (!avatar_id || !voice_id) {
      return NextResponse.json({ error: 'Missing avatar_id or voice_id.' }, { status: 400 });
    }
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing HeyGen API key.' }, { status: 500 });
    }

    const payload = {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: avatar_id,
            avatar_style: "normal",
            scale: 1.0,
            offset: { x: 0.0, y: 0.0 }
          },
          voice: {
            type: "text",
            voice_id: voice_id,
            input_text: script,
            speed: 1.0,
            pitch: 0
          },
          background: {
            type: "color",
            value: "#87CEEB"
          }
        }
      ],
      dimension: {
        width: 1280,
        height: 720
      },
      caption: false
    };

    console.log('Sending payload to HeyGen:', JSON.stringify(payload, null, 2));

    const heygenRes = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await heygenRes.json();
    console.log('HeyGen API response:', JSON.stringify(data, null, 2));

    if (!heygenRes.ok || data.error) {
      const message = data?.error?.message || data?.message || 'Failed to generate video.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Return the video_id - the frontend will need to poll for status
    return NextResponse.json({
      videoId: data.data.video_id,
      status: 'processing'
    }, { status: 200 });
  } catch (err: any) {
    console.error('Error generating video:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error.' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export function PUT() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export function DELETE() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
} 