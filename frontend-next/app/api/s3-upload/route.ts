import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createSupabaseServerClient } from '@/utils/supabaseServer';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function getContentType(fileName: string): string {
    if (fileName.endsWith('.mp3')) return 'audio/mpeg';
    if (fileName.endsWith('.mp4')) return 'video/mp4';
    if (fileName.endsWith('.txt')) return 'text/plain';
    return 'application/octet-stream';
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to upload a file.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'BadRequest', message: 'No file found.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const contentType = getContentType(fileName);

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    return NextResponse.json({ success: true, url: fileUrl }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to upload to S3', details: err?.message }, { status: 500 });
  }
} 