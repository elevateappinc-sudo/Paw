# PAW — Setup Guide

## Prerequisites

- Node.js 18+
- A Supabase project

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase Configuration

### 1. Run Migrations

Apply the database migrations in `supabase/migrations/` via the Supabase CLI or Dashboard SQL editor.

### 2. Configure Google OAuth

To enable Google login/signup via Supabase Auth:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Fill in:
   - **Client ID** — from [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client IDs
   - **Client Secret** — same place
4. In Google Cloud Console, add the following to **Authorized redirect URIs**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
5. In **Supabase → Authentication → URL Configuration**, set:
   - **Site URL**: `https://your-app-domain.com`
   - **Redirect URLs**: `https://your-app-domain.com/auth/callback`

> **Local development:** Add `http://localhost:3000/auth/callback` to Redirect URLs as well.

### 3. Enable PKCE Flow (recommended for PWA / iOS)

In Supabase Dashboard → **Authentication** → **Settings**, ensure **PKCE** is enabled (it is by default for new projects).

See `docs/ios-pwa-oauth-spike.md` for full iOS PWA OAuth compatibility notes.

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
