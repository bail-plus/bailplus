-- Notification reads mapping table to track in-app read status per user

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL REFERENCES public.communication_logs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT true,
  read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_notification_reads ON public.notification_reads(log_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON public.notification_reads(user_id);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_reads' AND policyname='notification_reads_select_own'
  ) THEN
    CREATE POLICY notification_reads_select_own ON public.notification_reads
      FOR SELECT USING (user_id::text = auth.uid()::text);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_reads' AND policyname='notification_reads_upsert_own'
  ) THEN
    CREATE POLICY notification_reads_upsert_own ON public.notification_reads
      FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_reads' AND policyname='notification_reads_update_own'
  ) THEN
    CREATE POLICY notification_reads_update_own ON public.notification_reads
      FOR UPDATE USING (user_id::text = auth.uid()::text) WITH CHECK (user_id::text = auth.uid()::text);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_reads' AND policyname='notification_reads_delete_own'
  ) THEN
    CREATE POLICY notification_reads_delete_own ON public.notification_reads
      FOR DELETE USING (user_id::text = auth.uid()::text);
  END IF;
END $$;

