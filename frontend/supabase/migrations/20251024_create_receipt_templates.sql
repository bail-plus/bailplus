-- Créer la table pour les modèles de quittances personnalisables
CREATE TABLE IF NOT EXISTS receipt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations du propriétaire
  landlord_name TEXT,
  landlord_address TEXT,
  landlord_city TEXT,

  -- Personnalisation visuelle
  logo_url TEXT, -- URL du logo uploadé dans Supabase Storage
  signature_url TEXT, -- URL de la signature uploadée
  stamp_url TEXT, -- URL du cachet uploadé

  -- Couleurs personnalisables (format hex)
  primary_color TEXT DEFAULT '#2563eb', -- Couleur principale (bleu par défaut)
  secondary_color TEXT DEFAULT '#1e40af', -- Couleur secondaire (bleu foncé)
  accent_color TEXT DEFAULT '#dbeafe', -- Couleur d'accent (bleu clair)

  -- Options d'affichage
  show_logo BOOLEAN DEFAULT false,
  show_signature BOOLEAN DEFAULT true,
  show_stamp BOOLEAN DEFAULT false,

  -- Texte personnalisable
  footer_text TEXT DEFAULT 'Document généré automatiquement par BailoGenius',
  declaration_text TEXT, -- Si null, utilise le texte par défaut

  -- Métadonnées
  template_name TEXT DEFAULT 'Modèle par défaut',
  is_default BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour rechercher par user_id
CREATE INDEX idx_receipt_templates_user_id ON receipt_templates(user_id);

-- Contrainte unique pour avoir un seul template par défaut par utilisateur
CREATE UNIQUE INDEX idx_receipt_templates_user_default ON receipt_templates(user_id, is_default) WHERE is_default = true;

-- RLS (Row Level Security)
ALTER TABLE receipt_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres templates
CREATE POLICY "Users can view own receipt templates"
  ON receipt_templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leurs propres templates
CREATE POLICY "Users can create own receipt templates"
  ON receipt_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent modifier leurs propres templates
CREATE POLICY "Users can update own receipt templates"
  ON receipt_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres templates
CREATE POLICY "Users can delete own receipt templates"
  ON receipt_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_receipt_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER receipt_templates_updated_at
  BEFORE UPDATE ON receipt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_receipt_templates_updated_at();

-- Commentaires
COMMENT ON TABLE receipt_templates IS 'Modèles personnalisables pour les quittances de loyer';
COMMENT ON COLUMN receipt_templates.logo_url IS 'URL du logo dans Supabase Storage (bucket PRIVATE)';
COMMENT ON COLUMN receipt_templates.signature_url IS 'URL de la signature dans Supabase Storage (bucket PRIVATE)';
COMMENT ON COLUMN receipt_templates.stamp_url IS 'URL du cachet dans Supabase Storage (bucket PRIVATE)';
COMMENT ON COLUMN receipt_templates.primary_color IS 'Couleur principale des en-têtes et titres (format hex)';
COMMENT ON COLUMN receipt_templates.is_default IS 'Template utilisé par défaut pour générer les quittances';
