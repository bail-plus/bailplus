-- ============================================
-- POLITIQUES DE STORAGE POUR LE BUCKET PRIVATE
-- À exécuter manuellement dans Supabase Studio SQL Editor
-- ============================================

-- 1. Créer le bucket PRIVATE s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('PRIVATE', 'PRIVATE', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can upload to PRIVATE" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view PRIVATE files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their PRIVATE files" ON storage.objects;

-- 3. Politique : Les utilisateurs authentifiés peuvent uploader
CREATE POLICY "Anyone can upload to PRIVATE"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'PRIVATE');

-- 4. Politique : Tous les utilisateurs authentifiés peuvent voir les fichiers
-- (Simple et fonctionne immédiatement, on pourra affiner plus tard)
CREATE POLICY "Authenticated users can view PRIVATE files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'PRIVATE');

-- 5. Politique : Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their PRIVATE files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'PRIVATE'
  AND owner = auth.uid()
);

-- Vérifier que tout est OK
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%PRIVATE%';
