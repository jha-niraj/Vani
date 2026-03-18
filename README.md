# Vani

Voice-first workspace that turns recordings into transcript, summary, and actionable tasks.

## What This Repo Contains

This is a Turborepo monorepo.

- `apps/main`: Next.js web app (email OTP auth, onboarding, recording + tasks UX)
- `apps/api-server`: backend service layer
- `apps/vani-mobile`: React Native / Expo app
- `packages/prisma`: shared Prisma schema + client
- `packages/auth`: shared NextAuth config and helpers
- `packages/ui`: shared UI components

## Core Technologies

- Next.js 15 + React 19
- TypeScript
- NextAuth (email OTP flow)
- PostgreSQL + Prisma ORM
- Supabase S3-compatible storage
- Sarvam AI (speech-to-text)
- OpenAI (extraction/chat)
- pnpm workspaces + Turborepo

## How The System Works

1. User signs in with email OTP.
2. User completes onboarding (language, use case, consent).
3. Audio is uploaded to storage and tracked in Postgres.
4. STT pipeline transcribes audio.
5. AI layer extracts summary, tags, and tasks.
6. Tasks and recording artifacts are shown in app screens.

## Current Feature Set

- Email OTP authentication with session cookies
- Multi-step onboarding with use-case selection
- Onboarding-aware route protection
- Recording/task data models in Prisma
- Shared auth and UI packages for web/mobile reuse

## Quick Start For Developers

1. Fork this repository in GitHub.
2. Clone your fork.
3. Install dependencies.
4. Create env file from template.
5. Push Prisma schema and generate client.
6. Start the main app.

```bash
git clone https://github.com/jha-niraj/Vani
cd vani
pnpm install

cp .env.example apps/main/.env

cd packages/prisma
pnpm db:push
pnpm db:generate

cd ../../apps/main
pnpm dev
```

Open `http://localhost:3000`.

## Environment Variables

Use `.env.example` as the reference. Only variable names are provided there.

Required variables:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `RESEND_API_KEY`
- `AUTH_FROM_EMAIL`
- `SARVAM_API_KEY`
- `OPENAI_API_KEY`
- `SUPABASE_ACCESS_KEY_ID`
- `SUPABASE_SECRET_ACCESS_KEY`
- `SUPABASE_REGION`
- `SUPABASE_STORAGE_ENDPOINT`
- `SUPABASE_S3_BUCKET_NAME`