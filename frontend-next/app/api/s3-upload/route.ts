import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

// Configure AWS SDK with environment variables
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function isValidFileName(fileName: string): boolean {
  // Only allow alphanumeric, dash, underscore, dot, and max 100 chars
  return /^[\w\-.]{1,100}$/.test(fileName);
}

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileContent, contentType } = await req.json();
    if (!fileName || !fileContent) {
      return new NextResponse(JSON.stringify({ error: 'Missing fileName or fileContent' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
      });
    }
    if (!isValidFileName(fileName)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid fileName' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
      });
    }
    // If fileContent is base64, decode it. Otherwise, treat as plain text.
    const buffer = fileContent.startsWith('data:')
      ? Buffer.from(fileContent.split(',')[1], 'base64')
      : Buffer.from(fileContent, 'base64');
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || '',
      Key: fileName,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    };
    const result = await s3.upload(params).promise();
    return new NextResponse(JSON.stringify({ message: 'File uploaded to S3!', url: result.Location }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error.message || 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
    });
  }
} 