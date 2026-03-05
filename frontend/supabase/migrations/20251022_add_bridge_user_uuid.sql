-- Ajouter le champ bridge_user_uuid à la table profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bridge_user_uuid TEXT UNIQUE;

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_bridge_user_uuid
  ON profiles(bridge_user_uuid);

-- Commentaire
COMMENT ON COLUMN profiles.bridge_user_uuid IS 'UUID de l''utilisateur dans Bridge API';
