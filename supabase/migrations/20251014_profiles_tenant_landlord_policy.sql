-- Allow a tenant to SELECT their landlord's profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_tenant_landlord'
  ) THEN
    CREATE POLICY profiles_select_tenant_landlord ON public.profiles
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.leases l
          LEFT JOIN public.contacts c ON c.id = l.tenant_id
          LEFT JOIN public.profiles tp ON tp.email = c.email
          WHERE l.user_id = profiles.user_id -- landlord owns lease
            AND l.status = 'active'
            AND (
              tp.user_id::text = auth.uid()::text -- tenant profile email matches contact email
              OR l.tenant_id::text = auth.uid()::text -- in case tenant_id stores profiles.user_id directly
            )
        )
      );
  END IF;
END $$;

