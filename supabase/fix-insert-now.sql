-- Paste into Supabase SQL Editor → Run (fixes "שגיאה בשמירה" from legacy columns)
-- Then re-run full schema.sql from this repo for RLS isolation.

DROP POLICY IF EXISTS "envelopes_all" ON public.envelopes;

DO $$
DECLARE
  keep text[] := ARRAY[
    'id', 'space_code', 'event_type', 'host_name', 'event_date',
    'attended', 'party_size_type', 'party_count',
    'amount_given', 'amount_received', 'notes', 'created_at'
  ];
  r record;
BEGIN
  FOR r IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'envelopes'
      AND column_name <> ALL (keep)
  LOOP
    EXECUTE format(
      'ALTER TABLE public.envelopes DROP COLUMN IF EXISTS %I CASCADE',
      r.column_name
    );
  END LOOP;
END $$;

-- Ensure required app columns exist
ALTER TABLE public.envelopes
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

UPDATE public.envelopes SET space_code = 'legacy' WHERE space_code IS NULL OR space_code = '';
UPDATE public.envelopes SET event_type = 'other' WHERE event_type IS NULL OR event_type = '';
UPDATE public.envelopes SET host_name = 'unknown' WHERE host_name IS NULL OR host_name = '';
UPDATE public.envelopes SET attended = true WHERE attended IS NULL;
UPDATE public.envelopes SET party_size_type = 'couple' WHERE party_size_type IS NULL;
UPDATE public.envelopes SET party_count = 2 WHERE party_count IS NULL;
UPDATE public.envelopes SET amount_given = 0 WHERE amount_given IS NULL;
UPDATE public.envelopes SET created_at = now() WHERE created_at IS NULL;

ALTER TABLE public.envelopes
  ALTER COLUMN space_code SET NOT NULL,
  ALTER COLUMN event_type SET NOT NULL,
  ALTER COLUMN host_name SET NOT NULL,
  ALTER COLUMN attended SET NOT NULL,
  ALTER COLUMN party_size_type SET NOT NULL,
  ALTER COLUMN party_count SET NOT NULL,
  ALTER COLUMN amount_given SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.envelopes TO anon, authenticated;
