-- Additional SELECT policies on maintenance_tickets so all concerned users can see tickets

-- 1) Allow assigned service provider to see the ticket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'maintenance_tickets'
      AND policyname = 'tickets_select_assigned_provider'
  ) THEN
    CREATE POLICY tickets_select_assigned_provider ON public.maintenance_tickets
      FOR SELECT
      USING (
        assigned_to::text = auth.uid()::text
      );
  END IF;
END $$;

-- 2) Allow tenant (by contact email mapping) to see the ticket
-- If maintenance_tickets.tenant_id references contacts.id, join by contacts.email = auth user's email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'maintenance_tickets'
      AND policyname = 'tickets_select_tenant_contact_email'
  ) THEN
    CREATE POLICY tickets_select_tenant_contact_email ON public.maintenance_tickets
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.contacts c
          WHERE c.id = maintenance_tickets.tenant_id
            AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      );
  END IF;
END $$;

