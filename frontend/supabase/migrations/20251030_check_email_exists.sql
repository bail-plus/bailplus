-- Fonction pour vérifier si un email existe déjà
-- Utilisable avant l'inscription sans authentification

CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Permet d'exécuter avec les droits du créateur de la fonction
AS $$
BEGIN
  -- Vérifier dans auth.users (table système Supabase)
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = email_to_check
  );
END;
$$;

-- Permettre l'accès public à cette fonction (sans authentification)
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;

-- Commentaire pour la documentation
COMMENT ON FUNCTION public.check_email_exists IS
'Vérifie si un email existe déjà dans la base de données. Retourne TRUE si l''email existe, FALSE sinon.';
