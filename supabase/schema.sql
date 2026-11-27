-- ============================================================
-- Envelope (מעטפות) – Supabase schema
-- Paste this entire script into: Supabase → SQL Editor → Run
--
-- Safe to re-run: CREATE IF NOT EXISTS + ALTER ADD COLUMN IF NOT EXISTS
-- so older envelopes tables (missing space_code, etc.) are upgraded.
--
-- QUICK FIX (only if the table is EMPTY and you prefer a clean slate):
--   DROP TABLE IF EXISTS public.envelopes CASCADE;
-- then re-run this entire script.
-- Prefer the non-destructive ALTER path below when you have data.
-- ============================================================

-- Shared monetary-gift envelopes, scoped by space_code (shared PIN).
-- There is NO email/password auth. Both phones use the same space_code
-- and the anon key. Treat space_code like a household password.

CREATE TABLE IF NOT EXISTS public.envelopes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_code      text NOT NULL,
  event_type      text NOT NULL,
  host_name       text NOT NULL,
  event_date      text,                          -- DD/MM/YYYY, year, or free text
  attended        boolean NOT NULL DEFAULT true,
  party_size_type text NOT NULL DEFAULT 'couple'
                    CHECK (party_size_type IN ('solo', 'couple', 'family')),
  party_count     integer NOT NULL DEFAULT 2,
  amount_given    numeric NOT NULL DEFAULT 0,
  amount_received numeric,                       -- optional "הריזיקה" tracking
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Upgrade path: older tables may exist without these columns.
-- CREATE TABLE IF NOT EXISTS skips creation, so we ADD missing columns here.
ALTER TABLE public.envelopes
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS space_code text,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS host_name text,
  ADD COLUMN IF NOT EXISTS event_date text,
  ADD COLUMN IF NOT EXISTS attended boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS party_size_type text DEFAULT 'couple',
  ADD COLUMN IF NOT EXISTS party_count integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS amount_given numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_received numeric,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- space_code: backfill then enforce NOT NULL (safe for empty + legacy rows)
UPDATE public.envelopes
SET space_code = 'legacy'
WHERE space_code IS NULL OR space_code = '';

ALTER TABLE public.envelopes
  ALTER COLUMN space_code SET NOT NULL;

-- Sensible defaults / NOT NULL for other required columns on upgraded tables
UPDATE public.envelopes SET event_type = 'other' WHERE event_type IS NULL OR event_type = '';
UPDATE public.envelopes SET host_name = 'unknown' WHERE host_name IS NULL OR host_name = '';
UPDATE public.envelopes SET attended = true WHERE attended IS NULL;
UPDATE public.envelopes SET party_size_type = 'couple' WHERE party_size_type IS NULL;
UPDATE public.envelopes SET party_count = 2 WHERE party_count IS NULL;
UPDATE public.envelopes SET amount_given = 0 WHERE amount_given IS NULL;
UPDATE public.envelopes SET created_at = now() WHERE created_at IS NULL;

ALTER TABLE public.envelopes
  ALTER COLUMN event_type SET NOT NULL,
  ALTER COLUMN host_name SET NOT NULL,
  ALTER COLUMN attended SET NOT NULL,
  ALTER COLUMN attended SET DEFAULT true,
  ALTER COLUMN party_size_type SET NOT NULL,
  ALTER COLUMN party_size_type SET DEFAULT 'couple',
  ALTER COLUMN party_count SET NOT NULL,
  ALTER COLUMN party_count SET DEFAULT 2,
  ALTER COLUMN amount_given SET NOT NULL,
  ALTER COLUMN amount_given SET DEFAULT 0,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

-- Ensure party_size_type check constraint exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'envelopes_party_size_type_check'
      AND conrelid = 'public.envelopes'::regclass
  ) THEN
    ALTER TABLE public.envelopes
      ADD CONSTRAINT envelopes_party_size_type_check
      CHECK (party_size_type IN ('solo', 'couple', 'family'));
  END IF;
END $$;

-- Ensure id is primary key when upgrading a table that lacked one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE contype = 'p'
      AND conrelid = 'public.envelopes'::regclass
  ) THEN
    -- Backfill any null ids before adding PK
    UPDATE public.envelopes SET id = gen_random_uuid() WHERE id IS NULL;
    ALTER TABLE public.envelopes ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.envelopes ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ALTER TABLE public.envelopes ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Legacy cleanup: older auth-based schemas had user_id NOT NULL, which blocks
-- anon inserts (this app has no login — access is via space_code only).
-- Policies that reference user_id / auth.uid() must be dropped BEFORE the column
-- (Postgres error 2BP01 otherwise — do not rely on CASCADE).
DROP POLICY IF EXISTS "envelopes_all" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_policy" ON public.envelopes;
DROP POLICY IF EXISTS "Users can manage their own envelopes" ON public.envelopes;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_select" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_insert" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_update" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_delete" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_select_own" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_insert_own" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_update_own" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_delete_own" ON public.envelopes;

ALTER TABLE public.envelopes DROP COLUMN IF EXISTS user_id;

-- Fast lookups / realtime filters by household space
CREATE INDEX IF NOT EXISTS envelopes_space_code_idx
  ON public.envelopes (space_code);

CREATE INDEX IF NOT EXISTS envelopes_space_host_idx
  ON public.envelopes (space_code, host_name);

-- Table-level grants (required — RLS policies alone are not enough)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.envelopes TO anon, authenticated;

-- Enable Row Level Security
ALTER TABLE public.envelopes ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running this script
DROP POLICY IF EXISTS "envelopes_select_anon" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_insert_anon" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_update_anon" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_delete_anon" ON public.envelopes;

-- Anon key can CRUD all rows. Access control = knowing the space_code.
-- The client ALWAYS filters by space_code; never ship the service_role key.
CREATE POLICY "envelopes_select_anon"
  ON public.envelopes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "envelopes_insert_anon"
  ON public.envelopes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "envelopes_update_anon"
  ON public.envelopes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "envelopes_delete_anon"
  ON public.envelopes FOR DELETE
  TO anon, authenticated
  USING (true);

-- Realtime: add table to the supabase_realtime publication
-- (safe to re-run; ignores if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'envelopes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.envelopes;
  END IF;
END $$;

-- ============================================================
-- SECURITY NOTES
-- 1. Use ONLY the anon (public) key in the frontend .env
-- 2. NEVER expose the service_role key in the app or git
-- 3. Pick a non-guessable space_code (e.g. random phrase / PIN)
-- 4. Anyone with both the anon key AND your space_code can read/write
-- ============================================================
