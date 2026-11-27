# Envelope (מעטפות) — Setup Guide

Hebrew RTL PWA for tracking wedding/event gift envelopes, with **shared Supabase sync** between two phones and **no email/password login**.

## Supabase setup (required)

1. **Authentication → Providers → Anonymous → Enable**
2. SQL Editor → paste the **entire** [`supabase/schema.sql`](./supabase/schema.sql) → **Run**

The script creates `spaces` / `space_members`, upgrades `envelopes`, and enforces RLS so only signed-in members of a notebook can read/write it (anonymous device sessions, no email).

## Environment variables (already done locally)

`.env` (gitignored) should contain:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Copy from Supabase → **Project Settings → API** (Project URL + **anon public** key). Never put `service_role` in the app.

## Local development

```bash
npm install
npm run dev
```

### Sharing a notebook (create → invite)

1. On first launch, tap **צור פנקס חדש** — the app generates a strong space code (e.g. `ABCD-EFGH`)
2. Use the share sheet: **העתק קישור הזמנה**, **העתק קוד**, or the system Share button
3. Partner opens the invite link (`?space=CODE`) or taps **הצטרף לפנקס** and enters the code
4. Both phones sync the same notebook via Supabase — no login

From Home you can reopen **שתף פנקס**, or leave and create/join another notebook.

## Deploy

### Cursor / grok.bot (`*.apps.grok.bot`)

Publish builds have no gitignored `.env`, so the app falls back to the embedded public anon config in `src/lib/supabasePublic.ts` (anon key is designed to be public). Traffic talks to Supabase directly (Realtime on).

### Vercel (optional; can still use env)

1. Import the GitHub repo at [vercel.com](https://vercel.com), framework **Vite**
2. Optionally set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (overrides the embedded public config)
3. Deploy — `vercel.json` rewrites `/sb` → Supabase (Realtime stays off on the proxy)

## Install on phone

- **iPhone (Safari):** Share → Add to Home Screen → **Envelope**
- **Android (Chrome):** Menu → Install app / Add to Home screen

## How sync works

- Creating or joining a space stores `space_code` in LocalStorage
- All reads/writes filter by that `space_code`
- Invite links use `?space=CODE` (deep-linked on boot)
- Supabase Realtime pushes live changes; LocalStorage caches for poor reception
- Use **גיבוי JSON / CSV** for offline backup

## Security

Each device signs in anonymously (no email). Notebooks use membership (`space_members`); RLS allows envelope access only to members. Invite links use a long generated code in the URL **hash** (`#space=…`). Treat the invite like a household password.
