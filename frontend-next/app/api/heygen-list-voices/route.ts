import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing Heygen API key' }, { status: 500 });
  }
  try {
    const res = await fetch('https://api.heygen.com/v2/voices', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Failed to fetch voices' }, { status: res.status });
    }
    // Unwrap voices from data property if present
    const voices = data.data?.voices || [];
    return NextResponse.json({ voices });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 