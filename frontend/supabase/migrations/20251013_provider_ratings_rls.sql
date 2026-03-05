-- RLS policies to allow providers to see their received ratings

-- Ensure RLS is enabled on provider_ratings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'provider_ratings'
  ) THEN
    RAISE NOTICE 'Table provider_ratings not found';
  END IF;
END $$;

ALTER TABLE IF EXISTS provider_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: providers can SELECT ratings for their own provider record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'provider_ratings' AND policyname = 'provider_ratings_select_for_provider'
  ) THEN
    CREATE POLICY provider_ratings_select_for_provider ON provider_ratings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM service_providers sp
          WHERE sp.id = provider_ratings.provider_id
            AND sp.user_id::text = auth.uid()::text
        )
      );
  END IF;
END $$;

-- Optional: raters can see their own ratings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'provider_ratings' AND policyname = 'provider_ratings_select_own_ratings'
  ) THEN
    CREATE POLICY provider_ratings_select_own_ratings ON provider_ratings
      FOR SELECT
      USING (rated_by::text = auth.uid()::text);
  END IF;
END $$;

