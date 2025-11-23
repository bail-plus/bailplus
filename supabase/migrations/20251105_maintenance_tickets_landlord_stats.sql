-- Permettre aux propriétaires (LANDLORD) de lire les tickets de maintenance de leurs propriétés
-- Ceci est nécessaire pour afficher les statistiques des prestataires (nombre d'interventions)

-- Policy: LANDLORD can SELECT tickets for their own properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'maintenance_tickets'
      AND policyname = 'tickets_select_landlord_properties'
  ) THEN
    CREATE POLICY tickets_select_landlord_properties ON public.maintenance_tickets
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM properties p
          WHERE p.id = maintenance_tickets.property_id
            AND p.user_id::text = auth.uid()::text
        )
      );
  END IF;
END $$;

-- Policy: LANDLORD can also SELECT tickets via assigned_to to get provider stats
-- (Alternative: allow reading assigned_to column for all LANDLORD users)
-- This is more permissive but necessary for statistics queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'maintenance_tickets'
      AND policyname = 'tickets_select_for_landlord_stats'
  ) THEN
    CREATE POLICY tickets_select_for_landlord_stats ON public.maintenance_tickets
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
