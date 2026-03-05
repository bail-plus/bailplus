-- Fonction pour mettre à jour le nombre total d'interventions d'un prestataire
CREATE OR REPLACE FUNCTION update_provider_total_interventions()
RETURNS TRIGGER AS $$
BEGIN
  -- Si un ticket est assigné à un prestataire (assigned_to)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.assigned_to IS NOT NULL THEN
      -- Mettre à jour le compteur d'interventions pour le prestataire assigné
      UPDATE service_providers
      SET total_interventions = (
        SELECT COUNT(*)
        FROM maintenance_tickets
        WHERE assigned_to = NEW.assigned_to
      )
      WHERE user_id::text = NEW.assigned_to;
    END IF;

    -- Si l'ancien assigné est différent du nouveau (changement d'assignation)
    IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT NULL AND OLD.assigned_to != NEW.assigned_to THEN
      -- Mettre à jour le compteur de l'ancien prestataire
      UPDATE service_providers
      SET total_interventions = (
        SELECT COUNT(*)
        FROM maintenance_tickets
        WHERE assigned_to = OLD.assigned_to
      )
      WHERE user_id::text = OLD.assigned_to;
    END IF;
  END IF;

  -- Si un ticket est supprimé
  IF TG_OP = 'DELETE' THEN
    IF OLD.assigned_to IS NOT NULL THEN
      -- Mettre à jour le compteur du prestataire
      UPDATE service_providers
      SET total_interventions = (
        SELECT COUNT(*)
        FROM maintenance_tickets
        WHERE assigned_to = OLD.assigned_to
      )
      WHERE user_id::text = OLD.assigned_to;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table maintenance_tickets
DROP TRIGGER IF EXISTS trigger_update_provider_interventions ON maintenance_tickets;
CREATE TRIGGER trigger_update_provider_interventions
  AFTER INSERT OR UPDATE OR DELETE ON maintenance_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_total_interventions();

-- Mettre à jour les valeurs existantes pour tous les prestataires
UPDATE service_providers sp
SET total_interventions = (
  SELECT COUNT(*)
  FROM maintenance_tickets mt
  WHERE mt.assigned_to = sp.user_id::text
);

COMMENT ON FUNCTION update_provider_total_interventions() IS
  'Met à jour automatiquement le nombre total d''interventions d''un prestataire dans la table service_providers';
