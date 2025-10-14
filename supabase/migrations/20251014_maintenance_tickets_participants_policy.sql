-- Allow any participant to SELECT maintenance_tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'maintenance_tickets'
      AND policyname = 'tickets_select_participant'
  ) THEN
    CREATE POLICY tickets_select_participant ON public.maintenance_tickets
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.ticket_participants tp
          WHERE tp.ticket_id = maintenance_tickets.id
            AND tp.user_id::text = auth.uid()::text
        )
      );
  END IF;
END $$;

