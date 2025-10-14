-- Ensure one rating per user per ticket for a given provider
-- Allows multiple ratings across different tickets and optional general ratings (ticket_id NULL)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uniq_provider_ratings_per_ticket'
  ) THEN
    CREATE UNIQUE INDEX uniq_provider_ratings_per_ticket
      ON provider_ratings (rated_by, provider_id, ticket_id)
      WHERE ticket_id IS NOT NULL;
  END IF;
END $$;

