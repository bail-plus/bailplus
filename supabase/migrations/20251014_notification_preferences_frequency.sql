-- Add frequency to notification_preferences

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'notification_frequency_enum' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.notification_frequency_enum AS ENUM ('immediate', 'daily');
  END IF;
END $$;

ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS frequency public.notification_frequency_enum NOT NULL DEFAULT 'immediate';

