-- Migration: Ajout de la géolocalisation et des zones d'intervention pour les prestataires
-- Date: 2025-11-05

-- ============================================================================
-- 1. Ajout des colonnes de géolocalisation à la table service_providers
-- ============================================================================

ALTER TABLE service_providers
ADD COLUMN IF NOT EXISTS intervention_radius_km INTEGER DEFAULT 50
  CHECK (intervention_radius_km >= 0 AND intervention_radius_km <= 500),
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN service_providers.intervention_radius_km IS 'Rayon d''intervention du prestataire en kilomètres';
COMMENT ON COLUMN service_providers.latitude IS 'Latitude de l''adresse du prestataire';
COMMENT ON COLUMN service_providers.longitude IS 'Longitude de l''adresse du prestataire';
COMMENT ON COLUMN service_providers.city IS 'Ville du prestataire';
COMMENT ON COLUMN service_providers.postal_code IS 'Code postal du prestataire';

-- ============================================================================
-- 2. Ajout des colonnes de géolocalisation à la table properties
-- ============================================================================

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Commentaires pour documentation
COMMENT ON COLUMN properties.latitude IS 'Latitude de la propriété';
COMMENT ON COLUMN properties.longitude IS 'Longitude de la propriété';

-- ============================================================================
-- 3. Création de la table provider_service_areas
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  city TEXT,
  postal_code TEXT,
  department TEXT, -- Ex: "75" pour Paris, "13" pour Bouches-du-Rhône
  region TEXT, -- Ex: "Île-de-France", "Provence-Alpes-Côte d'Azur"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte pour éviter les doublons
  UNIQUE(provider_id, postal_code)
);

-- Commentaires pour documentation
COMMENT ON TABLE provider_service_areas IS 'Zones géographiques dans lesquelles un prestataire accepte d''intervenir';
COMMENT ON COLUMN provider_service_areas.provider_id IS 'ID du prestataire';
COMMENT ON COLUMN provider_service_areas.city IS 'Ville dans laquelle le prestataire intervient';
COMMENT ON COLUMN provider_service_areas.postal_code IS 'Code postal dans lequel le prestataire intervient';
COMMENT ON COLUMN provider_service_areas.department IS 'Département (code à 2 ou 3 chiffres)';
COMMENT ON COLUMN provider_service_areas.region IS 'Région française';

-- ============================================================================
-- 4. Index pour optimiser les recherches géographiques
-- ============================================================================

-- Index sur les coordonnées pour les recherches de proximité
CREATE INDEX IF NOT EXISTS idx_service_providers_location
  ON service_providers(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_location
  ON properties(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index pour les recherches par code postal/ville
CREATE INDEX IF NOT EXISTS idx_service_providers_postal_code
  ON service_providers(postal_code);

CREATE INDEX IF NOT EXISTS idx_service_providers_city
  ON service_providers(city);

CREATE INDEX IF NOT EXISTS idx_provider_service_areas_provider_id
  ON provider_service_areas(provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_service_areas_postal_code
  ON provider_service_areas(postal_code);

CREATE INDEX IF NOT EXISTS idx_provider_service_areas_department
  ON provider_service_areas(department);

-- ============================================================================
-- 5. Fonction trigger pour mettre à jour updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_provider_service_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_provider_service_areas_updated_at
  BEFORE UPDATE ON provider_service_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_service_areas_updated_at();

-- ============================================================================
-- 6. Fonction SQL pour calculer la distance entre deux points (Haversine)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R CONSTANT DECIMAL := 6371; -- Rayon de la Terre en kilomètres
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Vérifier que les coordonnées sont valides
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;

  -- Convertir les degrés en radians
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);

  -- Formule de Haversine
  a := SIN(dLat/2) * SIN(dLat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dLon/2) * SIN(dLon/2);

  c := 2 * ATAN2(SQRT(a), SQRT(1-a));

  -- Retourner la distance en kilomètres
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Calcule la distance en kilomètres entre deux points géographiques (formule de Haversine)';

-- ============================================================================
-- 7. Vue pour faciliter la recherche de prestataires par proximité
-- ============================================================================

CREATE OR REPLACE VIEW available_providers_with_distance AS
SELECT
  sp.*,
  p.id as property_id,
  p.name as property_name,
  p.address as property_address,
  p.city as property_city,
  p.postal_code as property_postal_code,
  calculate_distance(
    sp.latitude,
    sp.longitude,
    p.latitude,
    p.longitude
  ) as distance_km
FROM service_providers sp
CROSS JOIN properties p
WHERE
  sp.available = true
  AND sp.latitude IS NOT NULL
  AND sp.longitude IS NOT NULL
  AND p.latitude IS NOT NULL
  AND p.longitude IS NOT NULL
  AND calculate_distance(
    sp.latitude,
    sp.longitude,
    p.latitude,
    p.longitude
  ) <= sp.intervention_radius_km;

COMMENT ON VIEW available_providers_with_distance IS 'Vue listant les prestataires disponibles avec leur distance par rapport à chaque propriété';

-- ============================================================================
-- 8. Politiques RLS (Row Level Security)
-- ============================================================================

-- Activer RLS sur la nouvelle table
ALTER TABLE provider_service_areas ENABLE ROW LEVEL SECURITY;

-- Politique pour les prestataires : peuvent voir et gérer leurs propres zones
CREATE POLICY "Prestataires peuvent voir leurs zones"
  ON provider_service_areas
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Prestataires peuvent créer leurs zones"
  ON provider_service_areas
  FOR INSERT
  WITH CHECK (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Prestataires peuvent modifier leurs zones"
  ON provider_service_areas
  FOR UPDATE
  USING (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Prestataires peuvent supprimer leurs zones"
  ON provider_service_areas
  FOR DELETE
  USING (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

-- Politique pour les propriétaires : peuvent voir toutes les zones (pour recherche)
CREATE POLICY "Propriétaires peuvent voir toutes les zones"
  ON provider_service_areas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND user_type = 'LANDLORD'
    )
  );
