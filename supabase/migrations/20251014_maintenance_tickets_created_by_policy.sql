-- Allow the author (created_by) to SELECT their own tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'maintenance_tickets'
      AND policyname = 'tickets_select_created_by'
  ) THEN
    CREATE POLICY tickets_select_created_by ON public.maintenance_tickets
      FOR SELECT
      USING (created_by::text = auth.uid()::text);
  END IF;
END $$;

