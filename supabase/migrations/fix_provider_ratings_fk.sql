-- Fix foreign key constraint on provider_ratings table
-- The ticket_id should only reference maintenance_tickets, not service_providers

-- 1. Drop the incorrect foreign key constraint
ALTER TABLE provider_ratings
DROP CONSTRAINT IF EXISTS provider_ratings_ticket_id_fkey;

-- 2. Ensure the correct foreign key exists (ticket_id -> maintenance_tickets)
-- This might already exist as provider_ratings_ticket_id_fkey1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'provider_ratings_ticket_id_fkey1'
  ) THEN
    ALTER TABLE provider_ratings
    ADD CONSTRAINT provider_ratings_ticket_id_fkey1
    FOREIGN KEY (ticket_id)
    REFERENCES maintenance_tickets(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Ensure provider_id correctly references service_providers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'provider_ratings_provider_id_fkey'
  ) THEN
    ALTER TABLE provider_ratings
    ADD CONSTRAINT provider_ratings_provider_id_fkey
    FOREIGN KEY (provider_id)
    REFERENCES service_providers(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Verify the structure
SELECT
  con.conname AS constraint_name,
  col.attname AS column_name,
  ref_table.relname AS referenced_table,
  ref_col.attname AS referenced_column
FROM pg_constraint con
JOIN pg_attribute col ON col.attnum = ANY(con.conkey) AND col.attrelid = con.conrelid
JOIN pg_class ref_table ON ref_table.oid = con.confrelid
JOIN pg_attribute ref_col ON ref_col.attnum = ANY(con.confkey) AND ref_col.attrelid = con.confrelid
WHERE con.conrelid = 'provider_ratings'::regclass
  AND con.contype = 'f'
ORDER BY con.conname;
