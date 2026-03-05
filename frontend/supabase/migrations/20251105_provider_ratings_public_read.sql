-- Permettre aux propriétaires (LANDLORD) de lire toutes les notes des prestataires
-- Ceci est nécessaire pour afficher les notes moyennes lors de la recherche de prestataires

-- Policy: LANDLORD can SELECT all provider ratings (read-only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'provider_ratings'
      AND policyname = 'provider_ratings_select_for_landlords'
  ) THEN
    CREATE POLICY provider_ratings_select_for_landlords ON provider_ratings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id::text = auth.uid()::text
            AND p.user_type = 'LANDLORD'
        )
      );
  END IF;
END $$;

-- Policy: SERVICE_PROVIDER can also SELECT all provider ratings (to compare)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'provider_ratings'
      AND policyname = 'provider_ratings_select_for_service_providers'
  ) THEN
    CREATE POLICY provider_ratings_select_for_service_providers ON provider_ratings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id::text = auth.uid()::text
            AND p.user_type = 'SERVICE_PROVIDER'
        )
      );
  END IF;
END $$;
