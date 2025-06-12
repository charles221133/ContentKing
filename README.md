# ContentKing

A platform for managing and organizing content.

---

## �� Project Overview
A modern content management platform built with Next.js (TypeScript), featuring integrated backend API routes for file uploads, YouTube transcript extraction, and more.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- AWS account (for S3 integration)

### Installation
```bash
# Clone the repository
 git clone <your-repo-url>
 cd ContentKing

# Install dependencies
 cd frontend-next
 npm install
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the `frontend-next` directory with the following variables:
```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-2
AWS_S3_BUCKET=images-from-ai
```

---

## 📚 API Documentation

All backend logic is now handled via Next.js API routes in the `frontend-next` app.

Example endpoints:
```
POST /api/upload
  - Uploads a file to S3 (multipart/form-data { file })
  - Response: { url: string }

POST /api/s3-upload
  - Uploads a file to S3 (JSON: { fileName, fileContent, contentType })
  - Response: { url: string }

POST /api/extract-transcript
  - Extracts transcript from a YouTube video (JSON: { url })
  - Response: { transcript, paragraphs, metadata }

GET /api/health
  - Returns API status
  - Response: { status: 'ok', message: 'Backend API is running!' }
```

---

## 🚦 Deployment

- Local: Run the Next.js app
```bash
cd frontend-next
npm run dev
```
- Production: Deploy the Next.js app (e.g., Vercel, AWS, etc.)

---

## 📝 Architecture & Migration Notes

- The project was fully migrated from a Create React App frontend and Express backend to a single Next.js (TypeScript) app.
- All backend endpoints are now implemented as API routes in Next.js.
- The old `frontend` and `backend` folders have been removed.
- Environment variables follow Next.js conventions.
- Security headers and input validation are implemented in API routes.

---

## 📅 Changelog

See [CHANGELOG.md](CHANGELOG.md) for project updates (if available).

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

> _This is a living document. Documentation will be updated as features are implemented and the project evolves._ 