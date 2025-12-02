-- Branding settings per entity
-- Creates table, trigger, indexes, and RLS policies aligned with existing schema

-- Ensure extension for UUID if needed (Supabase usually has it)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Table
CREATE TABLE IF NOT EXISTS public.branding_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL UNIQUE REFERENCES public.entities(id) ON DELETE CASCADE,
  brand_name text,
  logo_url text,
  primary_color text DEFAULT '#3b82f6',
  secondary_color text,
  footer_text text DEFAULT 'Cet email vous est envoyé par BailoGenius',
  from_name text,
  from_email text,
  reply_to_email text,
  updated_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branding_settings_entity ON public.branding_settings(entity_id);

-- 2) Trigger updated_at (reusable helper)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_branding_settings_updated_at ON public.branding_settings;
CREATE TRIGGER trg_branding_settings_updated_at
BEFORE UPDATE ON public.branding_settings
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 3) RLS
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: owner of the entity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'branding_settings' AND policyname = 'branding_select_owner'
  ) THEN
    CREATE POLICY branding_select_owner ON public.branding_settings
      FOR SELECT
      USING (
        entity_id IN (
          SELECT id FROM public.entities WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- INSERT: owner of the entity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'branding_settings' AND policyname = 'branding_upsert_owner'
  ) THEN
    CREATE POLICY branding_upsert_owner ON public.branding_settings
      FOR INSERT
      WITH CHECK (
        entity_id IN (
          SELECT id FROM public.entities WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- UPDATE: owner of the entity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'branding_settings' AND policyname = 'branding_update_owner'
  ) THEN
    CREATE POLICY branding_update_owner ON public.branding_settings
      FOR UPDATE
      USING (
        entity_id IN (
          SELECT id FROM public.entities WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        entity_id IN (
          SELECT id FROM public.entities WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

