-- Add tax and loan fields to properties table

-- Tax structure
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS tax_structure TEXT CHECK (tax_structure IN ('PHYSICAL_PERSON', 'SCI_IR', 'SCI_IS', 'LMNP', 'LMP')),
ADD COLUMN IF NOT EXISTS tax_regime TEXT CHECK (tax_regime IN ('REEL', 'MICRO_FONCIER', 'MICRO_BIC', 'REEL_SIMPLIFIE', 'REEL_NORMAL')),
ADD COLUMN IF NOT EXISTS marginal_tax_rate NUMERIC, -- TMI : 0, 11, 30, 41, 45
ADD COLUMN IF NOT EXISTS social_contributions_rate NUMERIC DEFAULT 17.2, -- Prélèvements sociaux
ADD COLUMN IF NOT EXISTS corporate_tax_rate NUMERIC, -- Taux IS pour SCI IS
ADD COLUMN IF NOT EXISTS dividend_distribution_percentage NUMERIC, -- % de dividendes distribués

-- Amortissement (pour LMNP/LMP en réel)
ADD COLUMN IF NOT EXISTS property_amortization_duration INTEGER, -- Durée amortissement bien (25-40 ans)
ADD COLUMN IF NOT EXISTS furniture_amortization_duration INTEGER, -- Durée amortissement mobilier (5-10 ans)
ADD COLUMN IF NOT EXISTS furniture_value NUMERIC, -- Valeur du mobilier

-- Crédit immobilier
ADD COLUMN IF NOT EXISTS has_loan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS loan_amount NUMERIC,
ADD COLUMN IF NOT EXISTS loan_rate NUMERIC, -- Taux annuel
ADD COLUMN IF NOT EXISTS loan_duration_months INTEGER, -- Durée en mois
ADD COLUMN IF NOT EXISTS loan_start_date DATE;

-- Comments pour documentation
COMMENT ON COLUMN public.properties.tax_structure IS 'Structure juridique: PHYSICAL_PERSON (Personne physique), SCI_IR (SCI à l''IR), SCI_IS (SCI à l''IS), LMNP (Loueur Meublé Non Pro), LMP (Loueur Meublé Pro)';
COMMENT ON COLUMN public.properties.tax_regime IS 'Régime fiscal: REEL (Réel), MICRO_FONCIER (Micro-foncier), MICRO_BIC (Micro-BIC), REEL_SIMPLIFIE (Réel simplifié), REEL_NORMAL (Réel normal)';
COMMENT ON COLUMN public.properties.marginal_tax_rate IS 'Tranche Marginale d''Imposition (TMI) en % : 0, 11, 30, 41, 45';
COMMENT ON COLUMN public.properties.social_contributions_rate IS 'Taux des prélèvements sociaux (défaut 17.2%)';
COMMENT ON COLUMN public.properties.corporate_tax_rate IS 'Taux d''IS pour SCI IS (15% jusqu''à 42500€, 25% au-delà)';
COMMENT ON COLUMN public.properties.dividend_distribution_percentage IS 'Pourcentage des bénéfices distribués en dividendes';
COMMENT ON COLUMN public.properties.property_amortization_duration IS 'Durée d''amortissement du bien en années (généralement 25-40 ans)';
COMMENT ON COLUMN public.properties.furniture_amortization_duration IS 'Durée d''amortissement du mobilier en années (généralement 5-10 ans)';
COMMENT ON COLUMN public.properties.furniture_value IS 'Valeur du mobilier pour LMNP/LMP';
COMMENT ON COLUMN public.properties.loan_amount IS 'Montant du prêt immobilier';
COMMENT ON COLUMN public.properties.loan_rate IS 'Taux d''intérêt annuel du prêt en %';
COMMENT ON COLUMN public.properties.loan_duration_months IS 'Durée du prêt en mois';
COMMENT ON COLUMN public.properties.loan_start_date IS 'Date de début du prêt';
