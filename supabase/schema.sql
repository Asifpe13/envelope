-- ============================================================
-- Envelope (מעטפות) – Supabase schema (auth + membership)
-- Paste this entire script into: Supabase → SQL Editor → Run
--
-- Also enable: Authentication → Providers → Anonymous → ON
-- ============================================================

-- Notebooks (spaces) and membership — access requires auth.uid()
CREATE TABLE IF NOT EXISTS public.spaces (
  code        text PRIMARY KEY,
  created_by  uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT spaces_code_len CHECK (char_length(code) >= 8)
);

CREATE TABLE IF NOT EXISTS public.space_members (
  space_code  text NOT NULL REFERENCES public.spaces (code) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_code, user_id)
);

CREATE INDEX IF NOT EXISTS space_members_user_idx
  ON public.space_members (user_id);

-- Envelopes table
CREATE TABLE IF NOT EXISTS public.envelopes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_code      text NOT NULL REFERENCES public.spaces (code) ON DELETE CASCADE,
  event_type      text NOT NULL,
  host_name       text NOT NULL,
  event_date      text,
  attended        boolean NOT NULL DEFAULT true,
  party_size_type text NOT NULL DEFAULT 'couple'
                    CHECK (party_size_type IN ('solo', 'couple', 'family')),
  party_count     integer NOT NULL DEFAULT 2,
  amount_given    numeric NOT NULL DEFAULT 0,
  amount_received numeric,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

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

-- Drop legacy columns that are not part of the app schema
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

-- Backfill defaults only for rows that already have a valid space in spaces
UPDATE public.envelopes e
SET event_type = 'other'
WHERE event_type IS NULL OR event_type = '';
UPDATE public.envelopes SET host_name = 'unknown' WHERE host_name IS NULL OR host_name = '';
UPDATE public.envelopes SET attended = true WHERE attended IS NULL;
UPDATE public.envelopes SET party_size_type = 'couple' WHERE party_size_type IS NULL;
UPDATE public.envelopes SET party_count = 2 WHERE party_count IS NULL;
UPDATE public.envelopes SET amount_given = 0 WHERE amount_given IS NULL;
UPDATE public.envelopes SET created_at = now() WHERE created_at IS NULL;

-- Register existing notebook codes before adding FK
INSERT INTO public.spaces (code, created_by)
SELECT DISTINCT e.space_code, NULL
FROM public.envelopes e
WHERE e.space_code IS NOT NULL
  AND e.space_code <> ''
  AND char_length(e.space_code) >= 8
ON CONFLICT (code) DO NOTHING;

-- Drop orphan envelope rows that cannot satisfy FK after upgrade
DELETE FROM public.envelopes e
WHERE e.space_code IS NULL
   OR e.space_code = ''
   OR NOT EXISTS (SELECT 1 FROM public.spaces s WHERE s.code = e.space_code);

ALTER TABLE public.envelopes
  ALTER COLUMN space_code SET NOT NULL,
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE contype = 'p'
      AND conrelid = 'public.envelopes'::regclass
  ) THEN
    UPDATE public.envelopes SET id = gen_random_uuid() WHERE id IS NULL;
    ALTER TABLE public.envelopes ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.envelopes ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ALTER TABLE public.envelopes ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Ensure FK to spaces (after orphans removed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'envelopes_space_code_fkey'
      AND conrelid = 'public.envelopes'::regclass
  ) THEN
    ALTER TABLE public.envelopes
      ADD CONSTRAINT envelopes_space_code_fkey
      FOREIGN KEY (space_code) REFERENCES public.spaces (code) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS envelopes_space_code_idx ON public.envelopes (space_code);
CREATE INDEX IF NOT EXISTS envelopes_space_host_idx ON public.envelopes (space_code, host_name);

-- Drop legacy open policies / helpers
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
DROP POLICY IF EXISTS "envelopes_select_anon" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_insert_anon" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_update_anon" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_delete_anon" ON public.envelopes;
DROP FUNCTION IF EXISTS public.request_space_code();

-- Grants: data only for authenticated sessions (anon key alone is not enough)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.spaces TO authenticated;
GRANT SELECT, INSERT ON TABLE public.space_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.envelopes TO authenticated;
REVOKE ALL ON TABLE public.envelopes FROM anon;
REVOKE ALL ON TABLE public.spaces FROM anon;
REVOKE ALL ON TABLE public.space_members FROM anon;

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelopes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spaces_select_member" ON public.spaces;
DROP POLICY IF EXISTS "spaces_insert_auth" ON public.spaces;
DROP POLICY IF EXISTS "members_select_self" ON public.space_members;
DROP POLICY IF EXISTS "members_insert_self" ON public.space_members;
DROP POLICY IF EXISTS "envelopes_select_member" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_insert_member" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_update_member" ON public.envelopes;
DROP POLICY IF EXISTS "envelopes_delete_member" ON public.envelopes;

CREATE POLICY "spaces_select_member"
  ON public.spaces FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.space_members m
      WHERE m.space_code = spaces.code AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "spaces_insert_auth"
  ON public.spaces FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "members_select_self"
  ON public.space_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "members_insert_self"
  ON public.space_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "envelopes_select_member"
  ON public.envelopes FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.space_members m
      WHERE m.space_code = envelopes.space_code AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "envelopes_insert_member"
  ON public.envelopes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.space_members m
      WHERE m.space_code = envelopes.space_code AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "envelopes_update_member"
  ON public.envelopes FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.space_members m
      WHERE m.space_code = envelopes.space_code AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.space_members m
      WHERE m.space_code = envelopes.space_code AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "envelopes_delete_member"
  ON public.envelopes FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.space_members m
      WHERE m.space_code = envelopes.space_code AND m.user_id = auth.uid()
    )
  );

-- RPCs: create / join notebook (require signed-in user, including anonymous)
CREATE OR REPLACE FUNCTION public.create_space(p_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  normalized text := upper(btrim(p_code));
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF char_length(normalized) < 8 THEN
    RAISE EXCEPTION 'Space code too short';
  END IF;

  INSERT INTO public.spaces (code, created_by)
  VALUES (normalized, uid)
  ON CONFLICT (code) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.spaces WHERE code = normalized) THEN
    RAISE EXCEPTION 'Could not create space';
  END IF;

  INSERT INTO public.space_members (space_code, user_id)
  VALUES (normalized, uid)
  ON CONFLICT DO NOTHING;

  RETURN normalized;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_space(p_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  normalized text := upper(btrim(regexp_replace(p_code, '[\s\-_.]+', '', 'g')));
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF char_length(normalized) < 8 THEN
    RAISE EXCEPTION 'Space code too short';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.spaces WHERE code = normalized) THEN
    RAISE EXCEPTION 'Space not found';
  END IF;

  INSERT INTO public.space_members (space_code, user_id)
  VALUES (normalized, uid)
  ON CONFLICT DO NOTHING;

  RETURN normalized;
END;
$$;

REVOKE ALL ON FUNCTION public.create_space(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_space(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_space(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_space(text) TO authenticated;

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'envelopes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.envelopes;
  END IF;
END $$;

-- ============================================================
-- SECURITY
-- 1. Enable Anonymous auth in the Supabase dashboard
-- 2. Clients must signInAnonymously (or other auth) before data access
-- 3. RLS: only space_members can read/write that notebook's envelopes
-- 4. Never ship service_role; anon key alone cannot query envelopes
-- ============================================================
