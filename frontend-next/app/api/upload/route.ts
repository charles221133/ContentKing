import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';
import formidable, { File } from 'formidable';
import { Readable } from 'stream';

// Disable Next.js default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function isValidFileName(fileName: string): boolean {
  return /^[\w\-.]{1,100}$/.test(fileName);
}

async function parseForm(req: Request): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req as any, (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming form
    const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      const form = formidable({ multiples: false });
      form.parse(req as any, (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });
    let file = files.file as File | File[] | undefined;
    if (Array.isArray(file)) {
      file = file[0];
    }
    if (!file || !file.originalFilename || !file.filepath) {
      return new NextResponse(JSON.stringify({ error: 'Missing file upload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
      });
    }
    if (!isValidFileName(file.originalFilename)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid fileName' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
      });
    }
    const fs = await import('fs/promises');
    const fileBuffer = await fs.readFile(file.filepath);
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || '',
      Key: file.originalFilename,
      Body: fileBuffer,
      ContentType: file.mimetype || 'application/octet-stream',
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