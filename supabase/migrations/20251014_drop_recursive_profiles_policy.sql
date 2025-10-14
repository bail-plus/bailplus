-- Drop the recursive profiles policy that caused 42P17 (infinite recursion)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_select_tenant_landlord'
  ) THEN
    DROP POLICY profiles_select_tenant_landlord ON public.profiles;
  END IF;
END $$;

