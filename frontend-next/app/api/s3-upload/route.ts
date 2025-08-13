import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const resolvedRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const resolvedAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const resolvedSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// I believe our key is amplify-comedy-cards

const s3Client = new S3Client({
  region: resolvedRegion,
  // Only pass explicit credentials if both are provided; otherwise allow default provider chain
  credentials: resolvedAccessKeyId && resolvedSecretAccessKey
    ? { accessKeyId: resolvedAccessKeyId, secretAccessKey: resolvedSecretAccessKey }
    : undefined,
});

function getContentType(fileName: string): string {
    if (fileName.endsWith('.mp3')) return 'audio/mpeg';
    if (fileName.endsWith('.mp4')) return 'video/mp4';
    if (fileName.endsWith('.txt')) return 'text/plain';
    return 'application/octet-stream';
}

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
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required' }, { status: 400 });
    }

    const bucketName = process.env.AWS_S3_BUCKET || process.env.NEXT_PUBLIC_S3_BUCKET;
    if (!bucketName) {
      console.error('S3 upload misconfiguration: Missing AWS_S3_BUCKET or NEXT_PUBLIC_S3_BUCKET env var');
      return NextResponse.json({ error: 'S3 is not configured' }, { status: 500 });
    }
    if (!resolvedRegion) {
      console.error('S3 upload misconfiguration: Missing AWS_REGION or AWS_DEFAULT_REGION env var');
      return NextResponse.json({ error: 'S3 region is not configured' }, { status: 500 });
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${user.id}/${fileName}`,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({ signedUrl, key: `${user.id}/${fileName}` });
  } catch (error) {
    console.error('Error creating signed URL', error);
    const message = error instanceof Error ? error.message : 'Failed to create signed URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 