import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'video_id is invalid: field required', status: 'failed' }, { status: 400 });
  }

  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'HeyGen API key not configured', status: 'failed' }, { status: 500 });
  }

  try {
    console.log('Checking video status for ID:', videoId);
    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': apiKey
      }
    });

    const data = await response.json();
    console.log('HeyGen API response:', data);

    if (!response.ok) {
      return NextResponse.json({ 
        error: data.error || 'Failed to get video status', 
        status: 'failed' 
      }, { status: response.status });
    }

    // Map the response to our expected format
    return NextResponse.json({
      status: data.data?.status || 'unknown',
      videoUrl: data.data?.video_url,
      thumbnailUrl: data.data?.thumbnail_url,
      gifUrl: data.data?.gif_url,
      error: data.data?.error
    });
  } catch (error: any) {
    console.error('Error checking video status:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to check video status', 
      status: 'failed' 
    }, { status: 500 });
  }
} 