-- Nettoyer toutes les policies RLS en double sur la table profiles
-- On supprime tout et on recrée proprement

-- 1. Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- 2. Recréer 4 policies claires et simples
-- SELECT: Les utilisateurs peuvent voir leur propre profil OU les profils liés (tenants)
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT
TO public
USING (
  auth.uid() = user_id
  OR auth.uid()::text = linked_to_landlord::text
);

-- INSERT: Les utilisateurs peuvent créer leur propre profil
CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Les utilisateurs peuvent supprimer leur propre profil
CREATE POLICY "profiles_delete" ON public.profiles
FOR DELETE
TO public
USING (auth.uid() = user_id);

-- Commenter les policies pour documentation
COMMENT ON POLICY "profiles_select" ON public.profiles IS 'Permet aux utilisateurs de voir leur propre profil et les profils liés (tenants)';
COMMENT ON POLICY "profiles_insert" ON public.profiles IS 'Permet aux utilisateurs de créer leur propre profil';
COMMENT ON POLICY "profiles_update" ON public.profiles IS 'Permet aux utilisateurs de mettre à jour leur propre profil';
COMMENT ON POLICY "profiles_delete" ON public.profiles IS 'Permet aux utilisateurs de supprimer leur propre profil';
