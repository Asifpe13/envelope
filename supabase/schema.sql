-- ============================================================
-- Envelope (מעטפות) – Supabase schema
-- Paste this entire script into: Supabase → SQL Editor → Run
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
