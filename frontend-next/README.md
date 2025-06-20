# parodypipeline.com

A platform for managing and organizing parody content.

---

## Project Overview
A modern parody content management platform built with Next.js (TypeScript), featuring integrated backend API routes for file uploads, YouTube transcript extraction, and more.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the homepage by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket-name
```

**Never commit `.env.local` to version control.**

## AWS S3 Upload API

This project includes an API route for uploading files to S3:

- **Endpoint:** `/api/s3-upload`
- **Method:** `POST`
- **Body:** JSON with `fileName`, `fileContent` (base64), and optional `contentType`

Example request:
```json
{
  "fileName": "example.txt",
  "fileContent": "SGVsbG8gd29ybGQh" // base64 for 'Hello world!'
}
```

Response:
```json
{
  "message": "File uploaded to S3!",
  "url": "https://your-bucket.s3.amazonaws.com/example.txt"
}
```

## Migration Notes
- This project was migrated from Create React App to Next.js with TypeScript.
- All backend logic is now handled in Next.js API routes.
- Environment variables follow Next.js conventions.
- Security headers and input validation are implemented in API routes.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Links

https://developers.tiktok.com/app/7516355499843913734/sandbox/7516865562321733637

- [Terms of Service](/terms-of-service)
- [Privacy Policy](/privacy-policy)

# Clone the repository
 git clone <your-repo-url>
 cd parodypipeline.com
