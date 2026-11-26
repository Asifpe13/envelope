# Envelope (מעטפות) — Setup Guide

Hebrew RTL PWA for tracking wedding/event gift envelopes, with **shared Supabase sync** between two phones and **no email/password login**.

## 1. Supabase database

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → New query.
3. Paste the full contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
4. Confirm Realtime is on for `envelopes` (the script adds it to `supabase_realtime`).

### Re-running / upgrading an old table

`schema.sql` is **idempotent**: it uses `CREATE TABLE IF NOT EXISTS` plus `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, so it upgrades an older `envelopes` table that is missing `space_code` (or other columns) instead of failing on `CREATE INDEX`.

If you already hit `ERROR: column "space_code" does not exist`, or inserts fail with `null value in column "user_id"`, just paste the **updated** `schema.sql` again and Run — no need to drop data. The script drops a legacy `user_id` column from older auth-based drafts.

**Optional clean slate** (only if the table is empty and you prefer recreate):

```sql
DROP TABLE IF EXISTS public.envelopes CASCADE;
```

Then paste and Run the full `schema.sql` again.

## 2. Environment variables

1. Copy `.env.example` → `.env` in the project root:

```bash
cp .env.example .env
```

2. In Supabase → **Project Settings → API**, copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_DEFAULT_SPACE_CODE=our-shared-pin
```

3. **Never** put the `service_role` key in `.env` or the frontend. Only the **anon** key belongs in the app.
4. `VITE_DEFAULT_SPACE_CODE` is optional — both phones can enter the same code on first launch instead.

Restart the dev server after changing `.env`.

## 3. Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

On first open, confirm the **קוד פנקס משותף**. Both phones must use the **same** code.

## 4. Production build

```bash
npm run build
npm run preview
```

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [vercel.com](https://vercel.com).
3. Framework preset: **Vite**.
4. Add the same env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_DEFAULT_SPACE_CODE`).
5. Deploy. Vercel will run `npm run build` and serve `dist/`.

## 6. Install on iPhone (Add to Home Screen)

1. Open the deployed HTTPS URL in **Safari**.
2. Tap the Share button → **Add to Home Screen**.
3. Confirm the name **Envelope**.
4. Launch from the home screen icon (standalone PWA).

### Android (Chrome)

Menu → **Install app** / **Add to Home screen**.

## 7. How sync works

- Both devices store `space_code` in `LocalStorage`.
- All reads/writes filter by that `space_code`.
- Supabase Realtime (`postgres_changes`) pushes inserts/updates/deletes live.
- Latest rows are also cached in `LocalStorage` for poor reception at event halls.
- Use **גיבוי JSON / CSV** on the home screen for an offline backup.

## Security reminder

Anyone who knows your **anon key** (public by design) **and** your `space_code` can read/write that shared notebook. Use a non-guessable shared code and treat it like a household PIN.
