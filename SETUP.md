# Envelope (מעטפות) — Setup Guide

Hebrew RTL PWA for tracking wedding/event gift envelopes, with **shared Supabase sync** between two phones and **no email/password login**.

## One remaining DB step

I cannot run DDL against your Supabase project from this agent (no `SUPABASE_ACCESS_TOKEN`, no `service_role`, no DB password — the anon key cannot alter schema).

**Do this once:** Supabase → **SQL Editor** → New query → paste the **entire** contents of [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.

That single script:

- upgrades an existing `envelopes` table (adds missing columns)
- drops legacy RLS policies that reference `user_id` (fixes `cannot drop column user_id … policy envelopes_all depends on it`)
- drops the legacy `user_id` column
- grants `anon` SELECT/INSERT/UPDATE/DELETE
- creates anon RLS policies
- enables Realtime

Safe to re-run.

## Environment variables (already done locally)

`.env` (gitignored) should contain:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_DEFAULT_SPACE_CODE=our-shared-pin
```

Copy from Supabase → **Project Settings → API** (Project URL + **anon public** key). Never put `service_role` in the app.

## Local development

```bash
npm install
npm run dev
```

On first open, confirm the **קוד פנקס משותף**. Both phones must use the **same** code.

## Deploy

### Vercel (recommended for Vite `VITE_*` env)

Cursor `publish-app` cannot bind `VITE_*` secrets (reserved). Use Vercel:

1. Import the GitHub repo at [vercel.com](https://vercel.com), framework **Vite**
2. Add the same three env vars as in `.env`
3. Deploy

Or claim a temporary agent deploy if one was provided in chat (expires ~60 minutes unless claimed).

## Install on phone

- **iPhone (Safari):** Share → Add to Home Screen → **Envelope**
- **Android (Chrome):** Menu → Install app / Add to Home screen

## How sync works

- Both devices store `space_code` in LocalStorage
- All reads/writes filter by that `space_code`
- Supabase Realtime pushes live changes; LocalStorage caches for poor reception
- Use **גיבוי JSON / CSV** for offline backup

## Security

Anyone who knows your **anon key** (public by design) **and** your `space_code` can read/write that notebook. Use a non-guessable shared code.
