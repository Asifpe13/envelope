# Envelope (מעטפות) — Setup Guide

Hebrew RTL PWA for tracking wedding/event gift envelopes, with **shared Supabase sync** between two phones and **no email/password login**.

## One remaining DB step

I cannot run DDL against your Supabase project from this agent (no `SUPABASE_ACCESS_TOKEN`, no `service_role`, no DB password — the anon key cannot alter schema).

**Do this once:** Supabase → **SQL Editor** → New query → paste the **entire** contents of [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.

That single script:

- upgrades an existing `envelopes` table (adds missing columns)
- drops legacy RLS policies that reference `user_id` (fixes `cannot drop column user_id … policy envelopes_all depends on it`)
- drops the legacy `user_id` column
- grants table access to `anon` under RLS
- creates space-scoped RLS policies (`x-space-code` header)
- enables Realtime

Safe to re-run.

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

### Vercel (recommended for Vite `VITE_*` env)

Cursor `publish-app` cannot bind `VITE_*` secrets (reserved). Use Vercel:

1. Import the GitHub repo at [vercel.com](https://vercel.com), framework **Vite**
2. Add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
3. Deploy

Or claim a temporary agent deploy if one was provided in chat (expires ~60 minutes unless claimed).

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

Row Level Security scopes every query to the notebook in the `x-space-code` request header (must match `space_code`). The anon key alone cannot list other households’ envelopes. Knowing both the anon key **and** a specific space code still grants access to that notebook — treat invite links like a household password.
